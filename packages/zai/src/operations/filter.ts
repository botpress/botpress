// eslint-disable consistent-type-definitions
import { z } from '@bpinternal/zui'

import { clamp } from 'lodash-es'
import { ZaiContext } from '../context'
import { Response } from '../response'
import { getTokenizer } from '../tokenizer'
import { fastHash, stringify, takeUntilTokens } from '../utils'
import { Zai } from '../zai'
import { PROMPT_INPUT_BUFFER, PROMPT_OUTPUT_BUFFER } from './constants'

type Example = {
  input: unknown
  filter: boolean
  reason?: string
}

const _Example = z.object({
  input: z.any(),
  filter: z.boolean(),
  reason: z.string().optional(),
})

export type Options = {
  /** The maximum number of tokens per item */
  tokensPerItem?: number
  /** Examples to filter the condition against */
  examples?: Array<Example>
}

const _Options = z.object({
  tokensPerItem: z
    .number()
    .min(1)
    .max(100_000)
    .optional()
    .describe('The maximum number of tokens per item')
    .default(250),
  examples: z.array(_Example).describe('Examples to filter the condition against').default([]),
})

declare module '@botpress/zai' {
  interface Zai {
    /** Filters elements of an array against a condition */
    filter<T>(input: Array<T>, condition: string, options?: Options): Response<Array<T>>
  }
}

const END = '■END■'

const filter = async <T>(
  input: Array<T>,
  condition: string,
  _options: Options | undefined,
  ctx: ZaiContext
): Promise<Array<T>> => {
  ctx.controller.signal.throwIfAborted()
  const options = _Options.parse(_options ?? {}) as Options
  const tokenizer = await getTokenizer()
  const model = await ctx.getModel()

  const taskId = ctx.taskId
  const taskType = 'zai.filter'

  const MAX_ITEMS_PER_CHUNK = 50
  const TOKENS_TOTAL_MAX = model.input.maxTokens - PROMPT_INPUT_BUFFER - PROMPT_OUTPUT_BUFFER
  const TOKENS_EXAMPLES_MAX = Math.floor(Math.max(250, TOKENS_TOTAL_MAX * 0.5))
  const TOKENS_CONDITION_MAX = clamp(TOKENS_TOTAL_MAX * 0.25, 250, tokenizer.count(condition))
  const TOKENS_INPUT_ARRAY_MAX = TOKENS_TOTAL_MAX - TOKENS_EXAMPLES_MAX - TOKENS_CONDITION_MAX

  condition = tokenizer.truncate(condition, TOKENS_CONDITION_MAX)

  let chunks: Array<typeof input> = []
  let currentChunk: typeof input = []
  let currentChunkTokens = 0

  for (const element of input) {
    const elementAsString = tokenizer.truncate(stringify(element, false), options.tokensPerItem)
    const elementTokens = tokenizer.count(elementAsString)

    if (currentChunkTokens + elementTokens > TOKENS_INPUT_ARRAY_MAX || currentChunk.length >= MAX_ITEMS_PER_CHUNK) {
      chunks.push(currentChunk)
      currentChunk = []
      currentChunkTokens = 0
    }

    currentChunk.push(element)
    currentChunkTokens += elementTokens
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  chunks = chunks.filter((x) => x.length > 0)

  // ■1:true■2:true■3:true

  const formatInput = (input: Example[], condition: string) => {
    return `
Condition to check:
${condition}

Items (from ■0 to ■${input.length - 1})
==============================
${input.map((x, idx) => `■${idx} = ${stringify(x.input ?? null, false)}`).join('\n')}
`.trim()
  }

  const formatExamples = (examples: Example[]) => {
    return `
${examples.map((x, idx) => `■${idx}:${!!x.filter ? 'true' : 'false'}`).join('')}
${END}
====
Here's the reasoning behind each example:
${examples.map((x, idx) => `■${idx}:${!!x.filter ? 'true' : 'false'}:${x.reason ?? 'No reason provided'}`).join('\n')}
`.trim()
  }

  const genericExamples: Example[] = [
    {
      input: 'apple',
      filter: true,
      reason: 'Apples are fruits',
    },
    {
      input: 'Apple Inc.',
      filter: false,
      reason: 'Apple Inc. is a company, not a fruit',
    },
    {
      input: 'banana',
      filter: true,
      reason: 'Bananas are fruits',
    },
    {
      input: 'potato',
      filter: false,
      reason: 'Potatoes are vegetables',
    },
  ]

  const genericExamplesMessages = [
    {
      type: 'text' as const,
      content: formatInput(genericExamples, 'is a fruit'),
      role: 'user' as const,
    },
    {
      type: 'text' as const,
      content: formatExamples(genericExamples),
      role: 'assistant' as const,
    },
  ]

  const filterChunk = async (chunk: typeof input) => {
    const examples =
      taskId && ctx.adapter
        ? await ctx.adapter
            .getExamples<string, unknown>({
              // The Table API can't search for a huge input string
              input: JSON.stringify(chunk).slice(0, 1000),
              taskType,
              taskId,
            })
            .then((x) =>
              x.map((y) => ({ filter: y.output as boolean, input: y.input, reason: y.explanation }) satisfies Example)
            )
        : []

    const allExamples = takeUntilTokens([...examples, ...(options.examples ?? [])], TOKENS_EXAMPLES_MAX, (el) =>
      tokenizer.count(stringify(el.input))
    )

    const exampleMessages = [
      {
        type: 'text' as const,
        content: formatInput(allExamples, condition),
        role: 'user' as const,
      },
      {
        type: 'text' as const,
        content: formatExamples(allExamples),
        role: 'assistant' as const,
      },
    ]

    const { extracted: partial, meta } = await ctx.generateContent({
      systemPrompt: `
You are given a list of items. Your task is to filter out the items that meet the condition below.
You need to return the full list of items with the format:
■x:true■y:false■z:true (where x, y, z are the indices of the items in the list)
You need to start with "■0" and go up to the last index "■${chunk.length - 1}".
If an item meets the condition, you should return ":true", otherwise ":false".

IMPORTANT: Make sure to read the condition and the examples carefully before making your decision.
The condition is: "${condition}"
`.trim(),
      stopSequences: [END],
      messages: [
        ...(exampleMessages.length ? exampleMessages : genericExamplesMessages),
        {
          type: 'text',
          content: formatInput(
            chunk.map((x) => ({ input: x }) as Example),
            condition
          ),
          role: 'user',
        },
      ],
      transform: (text) => {
        const indices = text
          .trim()
          .split('■')
          .filter((x) => x.length > 0)
          .map((x) => {
            const [idx, filter] = x.split(':')
            return { idx: parseInt(idx?.trim() ?? ''), filter: filter?.toLowerCase().trim() === 'true' }
          })

        return chunk.filter((_, idx) => {
          return indices.find((x) => x.idx === idx && x.filter) ?? false
        })
      },
    })

    if (taskId && ctx.adapter && !ctx.controller.signal.aborted) {
      const key = fastHash(
        stringify({
          taskId,
          taskType,
          input: JSON.stringify(chunk),
          condition,
        })
      )

      await ctx.adapter.saveExample({
        key,
        taskType,
        taskId,
        input: JSON.stringify(chunk),
        output: partial,
        instructions: condition,
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

    return partial
  }

  const filteredChunks = await Promise.all(chunks.map(filterChunk))

  return filteredChunks.flat()
}

Zai.prototype.filter = function <T>(
  this: Zai,
  input: Array<T>,
  condition: string,
  _options?: Options
): Response<Array<T>> {
  const context = new ZaiContext({
    client: this.client,
    modelId: this.Model,
    taskId: this.taskId,
    taskType: 'zai.filter',
    adapter: this.adapter,
  })

  return new Response<Array<T>>(context, filter(input, condition, _options, context), (result) => result)
}
