// eslint-disable consistent-type-definitions
import { z } from '@bpinternal/zui'

import { clamp } from 'lodash-es'
import pLimit from 'p-limit'
import { ZaiContext } from '../context'
import { Response } from '../response'
import { getTokenizer } from '../tokenizer'
import { fastHash, stringify, takeUntilTokens, abortSiblingsOnFailure } from '../utils'
import { Zai } from '../zai'
import { classifyYesNo, fitsClassifier, hasLearnedExamples, mapUnique, sumUsage } from './classifier'
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
    .optional()
    .describe("The maximum number of tokens per item (capped at the items' share of the model's input context)")
    .default(250),
  examples: z.array(_Example).describe('Examples to filter the condition against').default([]),
})

declare module '@botpress/zai' {
  interface Zai {
    /**
     * Filters array elements based on a natural language condition.
     *
     * This operation evaluates each element against a condition using LLMs,
     * returning only elements that match. Handles large arrays automatically
     * by processing in parallel chunks.
     *
     * @param input - Array of elements to filter
     * @param condition - Natural language description of what to keep
     * @param options - Configuration for token limits per item and examples
     * @returns Response promise resolving to filtered array
     *
     * @example Filter positive reviews
     * ```typescript
     * const reviews = [
     *   "Great product, love it!",
     *   "Terrible quality, broke immediately",
     *   "Amazing! Exceeded expectations",
     *   "Worst purchase ever"
     * ]
     *
     * const positive = await zai.filter(reviews, 'Keep only positive reviews')
     * // Result: ["Great product, love it!", "Amazing! Exceeded expectations"]
     * ```
     *
     * @example Filter technical questions
     * ```typescript
     * const questions = [
     *   "How do I deploy to production?",
     *   "What time is lunch?",
     *   "Why is the API returning 500 errors?",
     *   "Can you book the conference room?"
     * ]
     *
     * const technical = await zai.filter(
     *   questions,
     *   'Keep only technical or engineering questions'
     * )
     * // Result: ["How do I deploy to production?", "Why is the API returning 500 errors?"]
     * ```
     *
     * @example Filter with object array
     * ```typescript
     * const products = [
     *   { name: 'Laptop', category: 'Electronics', inStock: true },
     *   { name: 'Desk', category: 'Furniture', inStock: false },
     *   { name: 'Mouse', category: 'Electronics', inStock: true },
     *   { name: 'Chair', category: 'Furniture', inStock: true }
     * ]
     *
     * const available = await zai.filter(
     *   products,
     *   'Keep only products that are in stock'
     * )
     * // Returns products where inStock === true
     * ```
     *
     * @example Complex filtering logic
     * ```typescript
     * const emails = [...] // Array of email objects
     *
     * const urgent = await zai.filter(
     *   emails,
     *   'Keep emails that are urgent, from the CEO, or mention "critical bug"'
     * )
     * ```
     *
     * @example With examples for consistency
     * ```typescript
     * const filtered = await zai.filter(items, 'Keep valid entries', {
     *   examples: [
     *     {
     *       input: { status: 'active', verified: true },
     *       filter: true,
     *       reason: 'Active and verified'
     *     },
     *     {
     *       input: { status: 'pending', verified: false },
     *       filter: false,
     *       reason: 'Not yet verified'
     *     }
     *   ],
     *   tokensPerItem: 100 // Limit tokens per item for performance
     * })
     * ```
     */
    filter<T>(input: Array<T>, condition: string, options?: Options): Response<Array<T>>
  }
}

const END = '■END■'

/**
 * Saved examples are whole chunks: `input` is the JSON array of the chunk's items and `output` the items that were kept.
 * Expand them into one example per item (kept → true). Single-item examples with a boolean output are passed through.
 */
const toItemExamples = (input: unknown, output: unknown, explanation?: string): Example[] => {
  if (typeof output === 'boolean') {
    return [{ input, filter: output, reason: explanation }]
  }
  let items: unknown
  try {
    items = typeof input === 'string' ? JSON.parse(input) : input
  } catch {
    return []
  }
  if (!Array.isArray(items) || !Array.isArray(output)) {
    return []
  }
  const kept = new Set(output.map((o) => JSON.stringify(o)))
  return items.map((item) => ({ input: item, filter: kept.has(JSON.stringify(item)), reason: explanation }))
}

/**
 * Parses the model's filter decisions (`■0:true■1:false■2:true`).
 * Tolerates whitespace, newlines, code fences, prose around the decisions, `yes`/`no`, and trailing reasons
 * (`■0: true (it's a fruit)`). Throws (so the context retries with feedback) when an index is missing or out of range.
 */
export const parseFilterDecisions = (text: string, count: number): boolean[] => {
  const decisions: Array<boolean | undefined> = new Array(count).fill(undefined)
  const outOfRange: number[] = []
  const regex = /■\s*(\d+)\s*[:=]\s*\**\s*(true|false|yes|no)\b/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const idx = parseInt(match[1]!, 10)
    const value = match[2]!.toLowerCase()
    if (idx < 0 || idx >= count) {
      outOfRange.push(idx)
      continue
    }
    decisions[idx] = value === 'true' || value === 'yes'
  }

  const missing = decisions.map((d, i) => (d === undefined ? i : -1)).filter((i) => i >= 0)

  if (outOfRange.length || missing.length) {
    const problems: string[] = []
    if (missing.length) {
      problems.push(`missing decisions for item(s) ${missing.map((i) => `■${i}`).join(', ')}`)
    }
    if (outOfRange.length) {
      problems.push(`unknown item index(es) ${outOfRange.map((i) => `■${i}`).join(', ')}`)
    }
    throw new Error(
      `Invalid filter output: ${problems.join('; ')}. Items are numbered from ■0 to ■${count - 1}. ` +
        `Return one decision per item using the format ■0:true■1:false■2:true (indices start at 0).`
    )
  }

  return decisions as boolean[]
}

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
  options.tokensPerItem = Math.min(options.tokensPerItem, TOKENS_INPUT_ARRAY_MAX)

  const texts = input.map((element) => tokenizer.truncate(stringify(element, false), options.tokensPerItem))

  // The classification API decides each distinct item (yes/no on the condition). Items it is not confident
  // about (or cannot classify) go to the LLM. Examples can only be read by the LLM.
  const decided: Array<boolean | null> = input.map(() => null)
  if (
    ctx.usesClassifier &&
    !options.examples?.length &&
    fitsClassifier('x', condition) &&
    !(await hasLearnedExamples(ctx, taskType, input))
  ) {
    const candidates = texts.flatMap((text, i) => (fitsClassifier(text, condition) ? [i] : []))
    const answers = await mapUnique(
      candidates.map((i) => texts[i]!),
      (text) =>
        classifyYesNo(ctx, {
          input: text,
          question: `Does this item satisfy the condition: ${condition}`,
          model: ctx.classifier,
          priority: ctx.priority,
        })
    )
    candidates.forEach((i, n) => {
      decided[i] = answers[n]?.value ?? null
    })

    // Save the classifier's decisions like an LLM chunk (input: the items, output: the kept ones) so they can be
    // reviewed and approved
    const decidedItems = input.filter((_, i) => decided[i] !== null)
    if (decidedItems.length && taskId && ctx.adapter && !ctx.controller.signal.aborted) {
      const usage = sumUsage(answers)
      await ctx.adapter.saveExample({
        key: fastHash(stringify({ taskId, taskType, input: JSON.stringify(decidedItems), condition })),
        taskType,
        taskId,
        input: JSON.stringify(decidedItems),
        output: input.filter((_, i) => decided[i] === true),
        instructions: condition,
        metadata: {
          cost: { input: usage.cost, output: 0 },
          latency: usage.latency,
          model: usage.model,
          tokens: usage.tokens,
        },
      })
    }
  }

  // Each chunk keeps the original elements (returned to the caller) alongside their truncated
  // string form (what the model sees), so `tokensPerItem` actually bounds the prompt size.
  type ChunkItem = { element: T; text: string; index: number }
  let chunks: Array<ChunkItem[]> = []
  let currentChunk: ChunkItem[] = []
  let currentChunkTokens = 0

  for (const [index, element] of input.entries()) {
    if (decided[index] !== null) {
      continue
    }
    const elementAsString = texts[index]!
    const elementTokens = tokenizer.count(elementAsString)

    if (currentChunkTokens + elementTokens > TOKENS_INPUT_ARRAY_MAX || currentChunk.length >= MAX_ITEMS_PER_CHUNK) {
      chunks.push(currentChunk)
      currentChunk = []
      currentChunkTokens = 0
    }

    currentChunk.push({ element, text: elementAsString, index })
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

  const filterChunk = async (chunkItems: ChunkItem[]): Promise<void> => {
    ctx.controller.signal.throwIfAborted()
    const chunk = chunkItems.map((x) => x.element)
    const examples =
      taskId && ctx.adapter
        ? await ctx
            .getExamples<string, unknown>({
              // The Table API can't search for a huge input string
              input: JSON.stringify(chunk).slice(0, 1000),
              taskType,
              taskId,
            })
            .then((x) => x.flatMap((y) => toItemExamples(y.input, y.output, y.explanation)))
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

    const { extracted: decisions, meta } = await ctx.generateContent({
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
        ...(allExamples.length ? exampleMessages : genericExamplesMessages),
        {
          type: 'text',
          content: formatInput(
            chunkItems.map((x) => ({ input: x.text }) as Example),
            condition
          ),
          role: 'user',
        },
      ],
      transform: (text) => parseFilterDecisions(text ?? '', chunk.length),
      // v2: the result is the list of decisions (it was the list of kept items)
      memoVersion: 2,
    })

    chunkItems.forEach((item, idx) => {
      decided[item.index] = decisions[idx] === true
    })
    const partial = chunk.filter((_, idx) => decisions[idx] === true)

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
          model: ctx.modelName,
          tokens: {
            input: meta.tokens.input,
            output: meta.tokens.output,
          },
        },
      })
    }
  }

  const limit = pLimit(10) // Limit to 10 concurrent filtering operations
  await Promise.all(chunks.map((chunk) => limit(() => filterChunk(chunk)).catch(abortSiblingsOnFailure(ctx))))

  return input.filter((_, i) => decided[i] === true)
}

Zai.prototype.filter = function <T>(
  this: Zai,
  input: Array<T>,
  condition: string,
  _options?: Options
): Response<Array<T>> {
  const context = this._context('zai.filter')

  return new Response<Array<T>>(context, filter(input, condition, _options, context), (result) => result)
}
