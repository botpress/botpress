// eslint-disable consistent-type-definitions
import { z, ZodObject } from '@bpinternal/zui'

import JSON5 from 'json5'
import { jsonrepair } from 'jsonrepair'

import { chunk, isArray } from 'lodash-es'
import { ZaiContext } from '../context'
import { Response } from '../response'
import { getTokenizer } from '../tokenizer'
import { fastHash, stringify, takeUntilTokens } from '../utils'
import { Zai } from '../zai'
import { PROMPT_INPUT_BUFFER } from './constants'
import { JsonParsingError } from './errors'

export type Options = {
  /** Instructions to guide the user on how to extract the data */
  instructions?: string
  /** The maximum number of tokens per chunk */
  chunkLength?: number
  /** Whether to strictly follow the schema or not */
  strict?: boolean
}

const Options = z.object({
  instructions: z.string().optional().describe('Instructions to guide the user on how to extract the data'),
  chunkLength: z
    .number()
    .min(100)
    .max(100_000)
    .optional()
    .describe('The maximum number of tokens per chunk')
    .default(16_000),
  strict: z.boolean().optional().default(true).describe('Whether to strictly follow the schema or not'),
})

type __Z<T extends any = any> = { _output: T }
type OfType<O, T extends __Z = __Z<O>> = T extends __Z<O> ? T : never
type AnyObjectOrArray = Record<string, unknown> | Array<unknown>

declare module '@botpress/zai' {
  interface Zai {
    /** Extracts one or many elements from an arbitrary input */
    extract<S extends OfType<any>>(input: unknown, schema: S, options?: Options): Response<S['_output']>
  }
}

const START = '■json_start■'
const END = '■json_end■'
const NO_MORE = '■NO_MORE_ELEMENT■'

const extract = async <S extends OfType<AnyObjectOrArray>>(
  input: unknown,
  _schema: S,
  _options: Options | undefined,
  ctx: ZaiContext
): Promise<S['_output']> => {
  ctx.controller.signal.throwIfAborted()
  let schema = _schema as any as z.ZodType
  const options = Options.parse(_options ?? {})
  const tokenizer = await getTokenizer()
  const model = await ctx.getModel()

  const taskId = ctx.taskId
  const taskType = 'zai.extract'

  const PROMPT_COMPONENT = Math.max(model.input.maxTokens - PROMPT_INPUT_BUFFER, 100)

  let isArrayOfObjects = false
  let wrappedValue = false
  const originalSchema = schema

  const baseType = (schema.naked ? schema.naked() : schema)?.constructor?.name ?? 'unknown'

  if (baseType === 'ZodArray') {
    isArrayOfObjects = true
    let elementType = (schema as any).element
    if (elementType.naked) {
      elementType = elementType.naked()
    }

    if (elementType?.constructor?.name === 'ZodObject') {
      schema = elementType
    } else {
      wrappedValue = true
      schema = z.object({
        value: elementType,
      })
    }
  } else if (baseType !== 'ZodObject') {
    wrappedValue = true
    schema = z.object({
      value: originalSchema,
    })
  }

  if (!options.strict) {
    try {
      schema = (schema as ZodObject).partial()
    } catch {}
  }

  const schemaTypescript = schema.toTypescriptType({ declaration: false })
  const schemaLength = tokenizer.count(schemaTypescript)

  options.chunkLength = Math.min(options.chunkLength, model.input.maxTokens - PROMPT_INPUT_BUFFER - schemaLength)

  const keys = Object.keys((schema as ZodObject).shape)

  const inputAsString = stringify(input)

  if (tokenizer.count(inputAsString) > options.chunkLength) {
    const tokens = tokenizer.split(inputAsString)
    const chunks = chunk(tokens, options.chunkLength).map((x) => x.join(''))
    const all = await Promise.allSettled(
      chunks.map((chunk) =>
        extract(
          chunk,
          originalSchema,
          {
            ...options,
            strict: false, // We don't want to fail on strict mode for sub-chunks
          },
          ctx
        )
      )
    ).then((results) =>
      results.filter((x) => x.status === 'fulfilled').map((x) => (x as PromiseFulfilledResult<S['_output']>).value)
    )

    ctx.controller.signal.throwIfAborted()

    // We run this function recursively until all chunks are merged into a single output
    const rows = all.map((x, idx) => `<part-${idx + 1}>\n${stringify(x, true)}\n</part-${idx + 1}>`).join('\n')
    return extract(
      `
The result has been split into ${all.length} parts. Recursively merge the result into the final result.
When merging arrays, take unique values.
When merging conflictual (but defined) information, take the most reasonable and frequent value.
Non-defined values are OK and normal. Don't delete fields because of null values. Focus on defined values.

Here's the data:
${rows}

Merge it back into a final result.`.trim(),
      originalSchema,
      options,
      ctx
    )
  }

  const instructions: string[] = []

  if (options.instructions) {
    instructions.push(options.instructions)
  }

  const shape = `{ ${keys.map((key) => `"${key}": ...`).join(', ')} }`
  const abbv = '{ ... }'

  if (isArrayOfObjects) {
    instructions.push('You may have multiple elements, or zero elements in the input.')
    instructions.push('You must extract each element separately.')
    instructions.push(`Each element must be a JSON object with exactly the format: ${START}${shape}${END}`)
    instructions.push(`When you are done extracting all elements, type "${NO_MORE}" to finish.`)
    instructions.push(`For example, if you have zero elements, the output should look like this: ${NO_MORE}`)
    instructions.push(
      `For example, if you have two elements, the output should look like this: ${START}${abbv}${END}${START}${abbv}${END}${NO_MORE}`
    )
  } else {
    instructions.push('You may have exactly one element in the input.')
    instructions.push(`The element must be a JSON object with exactly the format: ${START}${shape}${END}`)
  }

  if (!options.strict) {
    instructions.push('You may ignore any fields that are not present in the input. All keys are optional.')
  }

  // All tokens remaining after the input and condition are accounted can be used for examples
  const EXAMPLES_TOKENS = PROMPT_COMPONENT - tokenizer.count(inputAsString) - tokenizer.count(instructions.join('\n'))

  const Key = fastHash(
    JSON.stringify({
      taskType,
      taskId,
      input: inputAsString,
      instructions: options.instructions,
    })
  )

  const examples =
    taskId && ctx.adapter
      ? await ctx.adapter.getExamples<string, unknown>({
          input: inputAsString,
          taskType,
          taskId,
        })
      : []

  const exactMatch = examples.find((x) => x.key === Key)
  if (exactMatch) {
    return exactMatch.output as any as S['_output']
  }

  const defaultExample = isArrayOfObjects
    ? {
        input: `The story goes as follow.
Once upon a time, there was a person named Alice who was 30 years old.
Then, there was a person named Bob who was 25 years old.
The end.`,
        schema: 'Array<{ name: string, age: number }>',
        instructions: 'Extract all people',
        extracted: [
          {
            name: 'Alice',
            age: 30,
          },
          {
            name: 'Bob',
            age: 25,
          },
        ],
      }
    : {
        input: `The story goes as follow.
Once upon a time, there was a person named Alice who was 30 years old.
The end.`,
        schema: '{ name: string, age: number }',
        instructions: 'Extract the person',
        extracted: { name: 'Alice', age: 30 },
      }

  const userExamples = examples.map((e) => ({
    input: e.input,
    extracted: e.output,
    schema: schemaTypescript,
    instructions: options.instructions,
  }))

  let exampleId = 1

  const formatInput = (input: string, schema: string, instructions?: string) => {
    const header = userExamples.length
      ? `Expert Example #${exampleId++}`
      : "Here's an example to help you understand the format:"

    return `
${header}

<|start_schema|>
${schema}
<|end_schema|>

<|start_instructions|>
${instructions ?? 'No specific instructions, just follow the schema above.'}
<|end_instructions|>

<|start_input|>
${input.trim()}
<|end_input|>
  `.trim()
  }

  const formatOutput = (extracted: any) => {
    extracted = isArray(extracted) ? extracted : [extracted]

    return (
      extracted
        .map((x: string) =>
          `
${START}
${JSON.stringify(x, null, 2)}
${END}`.trim()
        )
        .join('\n') + NO_MORE
    )
  }

  const formatExample = (example: { input?: any; schema: string; instructions?: string; extracted: any }) => [
    {
      type: 'text' as const,
      content: formatInput(stringify(example.input ?? null), example.schema, example.instructions),
      role: 'user' as const,
    },
    {
      type: 'text' as const,
      content: formatOutput(example.extracted),
      role: 'assistant' as const,
    },
  ]

  const allExamples = takeUntilTokens(
    userExamples.length ? userExamples : [defaultExample],
    EXAMPLES_TOKENS,
    (el) => tokenizer.count(stringify(el.input)) + tokenizer.count(stringify(el.extracted))
  )
    .map(formatExample)
    .flat()

  const { output, meta } = await ctx.generateContent({
    systemPrompt: `
Extract the following information from the input:
${schemaTypescript}
====

${instructions.map((x) => `• ${x}`).join('\n')}
`.trim(),
    stopSequences: [isArrayOfObjects ? NO_MORE : END],
    messages: [
      ...allExamples,
      {
        role: 'user',
        type: 'text',
        content: formatInput(inputAsString, schemaTypescript, options.instructions ?? ''),
      },
    ],
  })

  const answer = (output.choices[0]?.content ?? '{}') as string

  const elements = answer
    ?.split(START)
    .filter((x) => x.trim().length > 0 && x.includes('}'))
    .map((x) => {
      try {
        const json = x.slice(0, x.indexOf(END)).trim()
        const repairedJson = jsonrepair(json)
        const parsedJson = JSON5.parse(repairedJson)
        const safe = schema.safeParse(parsedJson)

        if (safe.success) {
          return safe.data
        }

        if (options.strict) {
          throw new JsonParsingError(x, safe.error)
        }

        return parsedJson
      } catch (error) {
        throw new JsonParsingError(x, error instanceof Error ? error : new Error('Unknown error'))
      }
    })
    .filter((x) => x !== null)

  let final: any

  if (isArrayOfObjects) {
    final = elements
  } else if (elements.length === 0) {
    final = options.strict ? schema.parse({}) : {}
  } else {
    final = elements[0]
  }

  if (wrappedValue) {
    if (Array.isArray(final)) {
      final = final.map((x) => ('value' in x ? x.value : x))
    } else {
      final = 'value' in final ? final.value : final
    }
  }

  if (taskId && ctx.adapter && !ctx.controller.signal.aborted) {
    await ctx.adapter.saveExample({
      key: Key,
      taskId: `zai/${taskId}`,
      taskType,
      instructions: options.instructions ?? 'No specific instructions',
      input: inputAsString,
      output: final,
      metadata: {
        cost: {
          input: meta.cost.input,
          output: meta.cost.output,
        },
        latency: meta.latency,
        model: ctx.modelId,
        tokens: {
          input: meta.tokens.input,
          output: meta.tokens.output,
        },
      },
    })
  }

  return final
}

Zai.prototype.extract = function <S extends OfType<AnyObjectOrArray>>(
  this: Zai,
  input: unknown,
  schema: S,
  _options?: Options
): Response<S['_output']> {
  const context = new ZaiContext({
    client: this.client,
    modelId: this.Model,
    taskId: this.taskId,
    taskType: 'zai.extract',
    adapter: this.adapter,
  })

  return new Response<S['_output']>(context, extract(input, schema, _options, context), (result) => result)
}
