// eslint-disable consistent-type-definitions
import { z, ZodObject, transforms } from '@bpinternal/zui'

import JSON5 from 'json5'
import { jsonrepair } from 'jsonrepair'

import { chunk, isArray } from 'lodash-es'
import pLimit from 'p-limit'
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
    /**
     * Extracts structured data from unstructured text using a Zod schema.
     *
     * This operation uses LLMs to intelligently parse text and extract information
     * according to your schema. It handles large inputs automatically by chunking
     * and supports both objects and arrays.
     *
     * @param input - The text or data to extract information from
     * @param schema - Zod schema defining the structure to extract
     * @param options - Optional configuration for extraction behavior
     * @returns A Response promise that resolves to data matching your schema
     *
     * @example Extract a single object
     * ```typescript
     * import { z } from '@bpinternal/zui'
     *
     * const personSchema = z.object({
     *   name: z.string(),
     *   age: z.number(),
     *   email: z.string().email()
     * })
     *
     * const text = "Contact John Doe (35) at john@example.com"
     * const person = await zai.extract(text, personSchema)
     * // Result: { name: 'John Doe', age: 35, email: 'john@example.com' }
     * ```
     *
     * @example Extract an array of items
     * ```typescript
     * const productSchema = z.array(z.object({
     *   name: z.string(),
     *   price: z.number()
     * }))
     *
     * const text = "We have Apple ($1.50), Banana ($0.80), and Orange ($1.20)"
     * const products = await zai.extract(text, productSchema)
     * // Result: [
     * //   { name: 'Apple', price: 1.50 },
     * //   { name: 'Banana', price: 0.80 },
     * //   { name: 'Orange', price: 1.20 }
     * // ]
     * ```
     *
     * @example With custom instructions
     * ```typescript
     * const result = await zai.extract(document, schema, {
     *   instructions: 'Only extract confirmed information, skip uncertain data',
     *   chunkLength: 10000, // Smaller chunks for better accuracy
     *   strict: true // Enforce strict schema validation
     * })
     * ```
     *
     * @example Track usage and cost
     * ```typescript
     * const response = zai.extract(text, schema)
     *
     * // Monitor progress
     * response.on('progress', (usage) => {
     *   console.log(`Tokens used: ${usage.tokens.total}`)
     *   console.log(`Cost so far: $${usage.cost.total}`)
     * })
     *
     * // Get full results
     * const { output, usage, elapsed } = await response.result()
     * console.log(`Extraction took ${elapsed}ms and cost $${usage.cost.total}`)
     * ```
     */
    extract<S extends OfType<any>>(input: unknown, schema: S, options?: Options): Response<S['_output']>
  }
}
const SPECIAL_CHAR = '■'
const START = '■json_start■'
const END = '■json_end■'
const NO_MORE = '■NO_MORE_ELEMENT■'
const ZERO_ELEMENTS = '■ZERO_ELEMENTS■'

const extract = async <S extends OfType<AnyObjectOrArray>>(
  input: unknown,
  _schema: S,
  _options: Options | undefined,
  ctx: ZaiContext
): Promise<S['_output']> => {
  ctx.controller.signal.throwIfAborted()

  let schema: z.ZodType
  try {
    schema = transforms.fromJSONSchema(transforms.toJSONSchema(_schema as any as z.ZodType))
  } catch {
    // The above transformers arent the legacy once. They are very strict and might fail on some schema types.
    schema = _schema as any as z.ZodType
  }

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

  const schemaTypescript = schema.toTypescriptType({ declaration: false, treatDefaultAsOptional: true })
  const schemaLength = tokenizer.count(schemaTypescript)

  options.chunkLength = Math.min(options.chunkLength, model.input.maxTokens - PROMPT_INPUT_BUFFER - schemaLength)

  const keys = Object.keys((schema as ZodObject).shape)

  const inputAsString = stringify(input)

  if (tokenizer.count(inputAsString) > options.chunkLength) {
    const limit = pLimit(10) // Limit to 10 concurrent extraction operations
    const tokens = tokenizer.split(inputAsString)
    const chunks = chunk(tokens, options.chunkLength).map((x) => x.join(''))
    const all = await Promise.allSettled(
      chunks.map((chunk) =>
        limit(() =>
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
    instructions.push(`If there are no elements to extract, respond with ${ZERO_ELEMENTS}.`)
    instructions.push(`When you are done extracting all elements, type "${NO_MORE}" to finish.`)
    instructions.push(
      `For example, if you have zero elements, the output should look like this: ${ZERO_ELEMENTS}${NO_MORE}`
    )
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

  const { meta, extracted } = await ctx.generateContent({
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
    transform: (text) =>
      (text || '{}')
        ?.split(START)
        .filter((x) => x.trim().length > 0 && x.includes('}'))
        .map((x) => {
          try {
            let json = x.slice(0, x.indexOf(END)).trim()

            if (json.includes(SPECIAL_CHAR)) {
              json = json.slice(0, json.indexOf(SPECIAL_CHAR)).trim()
            }

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
        .filter((x) => x !== null),
  })

  let final: any

  if (isArrayOfObjects) {
    final = extracted
  } else if (extracted.length === 0) {
    final = options.strict ? schema.parse({}) : {}
  } else {
    final = extracted[0]
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
