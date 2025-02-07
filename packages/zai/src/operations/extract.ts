// eslint-disable consistent-type-definitions
import { z } from '@bpinternal/zui'

import JSON5 from 'json5'
import { jsonrepair } from 'jsonrepair'

import { chunk, isArray } from 'lodash-es'
import { fastHash, stringify, takeUntilTokens } from '../utils'
import { Zai } from '../zai'
import { PROMPT_INPUT_BUFFER } from './constants'
import { JsonParsingError } from './errors'

export type Options = z.input<typeof Options>
const Options = z.object({
  instructions: z.string().optional().describe('Instructions to guide the user on how to extract the data'),
  chunkLength: z
    .number()
    .min(100)
    .max(100_000)
    .optional()
    .describe('The maximum number of tokens per chunk')
    .default(16_000),
})

declare module '@botpress/zai' {
  interface Zai {
    /** Extracts one or many elements from an arbitrary input */
    extract<S extends z.AnyZodObject>(input: unknown, schema: S, options?: Options): Promise<z.infer<S>>
    extract<S extends z.AnyZodObject>(
      input: unknown,
      schema: z.ZodArray<S>,
      options?: Options
    ): Promise<Array<z.infer<S>>>
  }
}

const START = '■json_start■'
const END = '■json_end■'
const NO_MORE = '■NO_MORE_ELEMENT■'

Zai.prototype.extract = async function (this: Zai, input, schema, _options) {
  const options = Options.parse(_options ?? {})
  const tokenizer = await this.getTokenizer()

  const taskId = this.taskId
  const taskType = 'zai.extract'

  const PROMPT_COMPONENT = Math.max(this.Model.input.maxTokens - PROMPT_INPUT_BUFFER, 100)

  let isArrayOfObjects = false
  const originalSchema = schema

  if (schema instanceof z.ZodObject) {
    // Do nothing
  } else if (schema instanceof z.ZodArray) {
    if (schema._def.type instanceof z.ZodObject) {
      isArrayOfObjects = true
      schema = schema._def.type
    } else {
      throw new Error('Schema must be a ZodObject or a ZodArray<ZodObject>')
    }
  } else {
    throw new Error('Schema must be either a ZuiObject or a ZuiArray<ZuiObject>')
  }

  const schemaTypescript = schema.toTypescript({ declaration: false })
  const schemaLength = tokenizer.count(schemaTypescript)

  options.chunkLength = Math.min(options.chunkLength, this.Model.input.maxTokens - PROMPT_INPUT_BUFFER - schemaLength)

  const keys = Object.keys(schema.shape)

  let inputAsString = stringify(input)

  if (tokenizer.count(inputAsString) > options.chunkLength) {
    // If we want to extract an array of objects, we will run this function recursively
    if (isArrayOfObjects) {
      const tokens = tokenizer.split(inputAsString)
      const chunks = chunk(tokens, options.chunkLength).map((x) => x.join(''))
      const all = await Promise.all(chunks.map((chunk) => this.extract(chunk, originalSchema as z.AnyZodObject)))

      return all.flat()
    } else {
      // Truncate the input to fit the model's input size
      inputAsString = tokenizer.truncate(stringify(input), options.chunkLength)
    }
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

  const examples = taskId
    ? await this.adapter.getExamples<string, unknown>({
        input: inputAsString,
        taskType,
        taskId,
      })
    : []

  const exactMatch = examples.find((x) => x.key === Key)
  if (exactMatch) {
    return exactMatch.output
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

  const output = await this.callModel({
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

  const answer = output.choices[0]?.content as string

  const elements = answer
    .split(START)
    .filter((x) => x.trim().length > 0)
    .map((x) => {
      try {
        const json = x.slice(0, x.indexOf(END)).trim()
        const repairedJson = jsonrepair(json)
        const parsedJson = JSON5.parse(repairedJson)

        return schema.parse(parsedJson)
      } catch (error) {
        throw new JsonParsingError(x, error instanceof Error ? error : new Error('Unknown error'))
      }
    })
    .filter((x) => x !== null)

  let final: any

  if (isArrayOfObjects) {
    final = elements
  } else if (elements.length === 0) {
    final = schema.parse({})
  } else {
    final = elements[0]
  }

  if (taskId) {
    await this.adapter.saveExample({
      key: Key,
      taskId: `zai/${taskId}`,
      taskType,
      instructions: options.instructions ?? 'No specific instructions',
      input: inputAsString,
      output: final,
      metadata: output.metadata,
    })
  }

  return final
}
