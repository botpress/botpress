// eslint-disable consistent-type-definitions
import { z } from '@bpinternal/zui'

import { chunk } from 'lodash-es'
import pLimit from 'p-limit'
import { ZaiContext } from '../context'
import { Response } from '../response'

import { getTokenizer } from '../tokenizer'
import { allOrAbort } from '../utils'
import { Zai } from '../zai'
import { PROMPT_INPUT_BUFFER, PROMPT_OUTPUT_BUFFER } from './constants'

export type Options = {
  /** What should the text be summarized to? */
  prompt?: string
  /** How to format the example text */
  format?: string
  /** The length of the summary in tokens */
  length?: number
  /** How many times longer (than final length) are the intermediate summaries generated */
  intermediateFactor?: number
  /** The maximum number of iterations to perform (windows on the sliding strategy, merge rounds on the parallel one) */
  maxIterations?: number
  /**
   * How text longer than one window is summarized.
   * - `parallel` (default): the text is cut into the fewest equal parts that fit a window, the parts are summarized at
   *   the same time, then their summaries are merged.
   * - `sliding`: window after window, each call amending the running summary (one call at a time).
   * Text that fits one window is summarized in one call either way.
   */
  strategy?: 'parallel' | 'sliding'
  /** Window options */
  sliding?: {
    /** Tokens of text per call. Defaults to, and can't exceed, what fits the model's input context. */
    window?: number
    /** Tokens shared by consecutive windows */
    overlap?: number
  }
}

const Options = z.object({
  prompt: z
    .string()
    .describe('What should the text be summarized to?')
    .default('New information, concepts and ideas that are deemed important'),
  format: z
    .string()
    .describe('How to format the example text')
    .default(
      'A normal text with multiple sentences and paragraphs. Use markdown to format the text into sections. Use headings, lists, and other markdown features to make the text more readable. Do not include links, images, or other non-text elements.'
    ),
  length: z.number().min(10).max(100_000).describe('The length of the summary in tokens').default(250),
  intermediateFactor: z
    .number()
    .min(1)
    .max(10)
    .describe('How many times longer (than final length) are the intermediate summaries generated')
    .default(4),
  maxIterations: z.number().min(1).default(100),
  strategy: z
    .enum(['parallel', 'sliding'])
    .describe(
      'How text longer than one window is summarized: parts at the same time, then merged, or window after window'
    )
    .default('parallel'),
  sliding: z
    .object({
      window: z
        .number()
        .min(10)
        .optional()
        .describe("Tokens of text per call; defaults to, and can't exceed, what fits the model's input context"),
      overlap: z.number().min(0).default(250),
    })
    .describe('Window options')
    .default({ overlap: 250 }),
})

declare module '@botpress/zai' {
  interface Zai {
    /**
     * Summarizes text of any length to a target length using intelligent chunking strategies.
     *
     * This operation can handle documents from a few paragraphs to entire books. Text that fits
     * the model's input context is summarized in one call. Longer text is summarized by one of two strategies:
     * - **Parallel** (default): cuts the text into the fewest parts that fit a call, summarizes them
     *   at the same time, then merges their summaries
     * - **Sliding window**: processes overlapping windows one after the other, amending a running summary
     *
     * @param original - The text to summarize
     * @param options - Configuration for length, focus, format, and chunking strategy
     * @returns Response promise resolving to the summary text
     *
     * @example Basic summarization
     * ```typescript
     * const article = "Long article text here..."
     * const summary = await zai.summarize(article, {
     *   length: 100 // Target 100 tokens (~75 words)
     * })
     * ```
     *
     * @example Custom focus and format
     * ```typescript
     * const meetingNotes = "... detailed meeting transcript ..."
     * const summary = await zai.summarize(meetingNotes, {
     *   length: 200,
     *   prompt: 'Key decisions, action items, and next steps',
     *   format: 'Bullet points with clear sections for Decisions, Actions, and Next Steps'
     * })
     * ```
     *
     * @example Summarizing very large documents
     * ```typescript
     * const book = await readFile('large-book.txt', 'utf-8') // 100k+ tokens
     * const summary = await zai.summarize(book, {
     *   length: 500,
     *   intermediateFactor: 4, // Intermediate summaries can be 4x target length
     *   prompt: 'Main themes, key events, and character development'
     * })
     * // Parts are summarized in parallel, then merged
     * ```
     *
     * @example Technical documentation summary
     * ```typescript
     * const docs = "... API documentation ..."
     * const summary = await zai.summarize(docs, {
     *   length: 300,
     *   prompt: 'Core API endpoints, authentication methods, and rate limits',
     *   format: 'Structured markdown with code examples where relevant'
     * })
     * ```
     *
     * @example Adjusting chunking strategy
     * ```typescript
     * const summary = await zai.summarize(document, {
     *   length: 150,
     *   strategy: 'sliding', // One window after the other (default: 'parallel')
     *   sliding: {
     *     window: 30000,  // Process 30k tokens at a time
     *     overlap: 500    // 500 token overlap between windows
     *   }
     * })
     * ```
     *
     * @example Progress tracking for long documents
     * ```typescript
     * const response = zai.summarize(veryLongDocument, { length: 400 })
     *
     * response.on('progress', (usage) => {
     *   console.log(`Progress: ${Math.round(usage.requests.percentage * 100)}%`)
     *   console.log(`Tokens used: ${usage.tokens.total}`)
     * })
     *
     * const summary = await response
     * ```
     */
    summarize(original: string, options?: Options): Response<string>
  }
}

const START = '■START■'
const END = '■END■'
const SEPARATOR = '\n\n============\n\n'

/** Tokens the system prompt and message scaffolding take, beside the caller's prompt and format */
const SCAFFOLD_TOKENS = 600

/**
 * Share of the model's input context the window may fill. The library's tokenizer is not the provider's, and some
 * providers count the generated tokens against the same context, so a call is sized below the stated limit.
 */
const INPUT_FILL = 0.9

/** Summaries written at once on the parallel path */
const CONCURRENCY = 10

/**
 * A window must take at least this many intermediate summaries, or merging them doesn't make the text shorter (models
 * overshoot the length they're asked for, so two summaries can take up to ~3 lengths).
 */
const MIN_SUMMARIES_PER_WINDOW = 3

/** Strips what follows a stop tag the model only partly wrote (e.g. "■EN"), and nothing else */
const stripTags = (text: string) => {
  let result = text
  if (result.includes(START)) {
    result = result.slice(result.indexOf(START) + START.length)
  }
  if (result.includes(END)) {
    result = result.slice(0, result.indexOf(END))
  }
  return result.replace(/■[A-Z]{0,5}$/, '').trim()
}

/**
 * Output tokens a call gets to write a summary asked to be `length` tokens long. Models count tokens with their own
 * tokenizer and overshoot the length they're asked for, so the budget has headroom above the length.
 */
const OUTPUT_HEADROOM = 1.5
const outputBudget = (length: number, maxOutputSize: number) =>
  Math.min(maxOutputSize, Math.ceil(length * OUTPUT_HEADROOM) + 256)

/** Calls one summary may take when the model runs out of output tokens before it finishes */
const MAX_ATTEMPTS = 3

class SummaryTruncatedError extends Error {
  public constructor(budget: number) {
    super(
      `The model ran out of output tokens (${budget}) before it finished the summary, ${MAX_ATTEMPTS} times. Ask for a shorter \`length\`, or use a model with a larger output limit.`
    )
    this.name = 'SummaryTruncatedError'
  }
}

/**
 * Writes one summary of about `length` tokens. A call that stops on its output limit is never returned as if it were
 * complete: it is made again with a larger budget (up to the model's output limit) and an instruction to be shorter,
 * and after MAX_ATTEMPTS the summary fails.
 */
const writeSummary = async (
  ctx: ZaiContext,
  props: { systemPrompt: string; content: string; length: number; maxOutputSize: number }
): Promise<string> => {
  let budget = outputBudget(props.length, props.maxOutputSize)
  let systemPrompt = props.systemPrompt

  for (let attempt = 1; ; attempt++) {
    const maxTokens = budget
    const { extracted } = await ctx.generateContent({
      systemPrompt,
      messages: [{ type: 'text', role: 'user', content: props.content }],
      maxTokens,
      stopSequences: [END],
      transform: (text, response) => {
        if (!text?.trim().length) {
          throw new Error('The model did not return a valid summary. The response was empty.')
        }
        const { stopReason, usage } = response.metadata
        const truncated = stopReason ? stopReason === 'max_tokens' : (usage?.outputTokens ?? 0) >= maxTokens
        return { text, truncated }
      },
    })

    if (!extracted.truncated) {
      return stripTags(extracted.text)
    }

    if (attempt >= MAX_ATTEMPTS) {
      throw new SummaryTruncatedError(maxTokens)
    }

    budget = Math.min(props.maxOutputSize, budget * 2)
    const shorter = Math.max(10, Math.floor(props.length * 0.75))
    systemPrompt = `${props.systemPrompt}

IMPORTANT: A previous attempt at this summary was cut off after ${maxTokens} tokens. Write a shorter summary of at most ${shorter} tokens, and end it with ${END}.`
  }
}

const summarize = async (original: string, options: Options, ctx: ZaiContext): Promise<string> => {
  ctx.controller.signal.throwIfAborted()
  const tokenizer = await getTokenizer()
  const model = await ctx.getModel()

  const INPUT_COMPONENT_SIZE = Math.max(100, (model.input.maxTokens - PROMPT_INPUT_BUFFER) / 4)
  options.prompt = tokenizer.truncate(options.prompt, INPUT_COMPONENT_SIZE)
  options.format = tokenizer.truncate(options.format, INPUT_COMPONENT_SIZE)

  const maxOutputSize = model.output.maxTokens - PROMPT_OUTPUT_BUFFER
  if (options.length > maxOutputSize) {
    throw new Error(
      `The desired output length is ${options.length} tokens long, which is more than the maximum of ${maxOutputSize} tokens for this model (${model.name})`
    )
  }

  // What one call can take besides the text: the model's input context, less the prompt and scaffolding
  const capacity =
    Math.floor(model.input.maxTokens * INPUT_FILL) -
    PROMPT_INPUT_BUFFER -
    SCAFFOLD_TOKENS -
    tokenizer.count(options.prompt) -
    tokenizer.count(options.format)

  // The most text one call can take: the capacity, less the running summary a sliding step carries and the summary it
  // writes.
  const windowFor = (intermediate: number) => capacity - intermediate - outputBudget(intermediate, maxOutputSize)

  // On a small context, the intermediate summaries are made shorter (down to the final length) so a window still
  // takes several of them, instead of the window shrinking to almost nothing
  let intermediateLength = Math.min(options.length * options.intermediateFactor, maxOutputSize)
  while (
    intermediateLength > options.length &&
    windowFor(intermediateLength) < MIN_SUMMARIES_PER_WINDOW * intermediateLength
  ) {
    intermediateLength = Math.max(options.length, Math.floor(intermediateLength / 2))
  }

  const modelWindow = windowFor(intermediateLength)
  const window = Math.min(options.sliding.window ?? modelWindow, modelWindow)

  if (tokenizer.count(original) > window) {
    // The text takes several calls: their summaries must be short enough to be merged, a few per window
    while (intermediateLength > options.length && window < MIN_SUMMARIES_PER_WINDOW * intermediateLength) {
      intermediateLength = Math.max(options.length, Math.floor(intermediateLength / 2))
    }
    if (window < MIN_SUMMARIES_PER_WINDOW * options.length) {
      throw new Error(
        `The text is too long to be summarized to ${options.length} tokens with this model (${model.name}): one call can take ${Math.max(0, window)} tokens of text, and summarizing it in parts needs at least ${MIN_SUMMARIES_PER_WINDOW * options.length} (${MIN_SUMMARIES_PER_WINDOW} times the length). Ask for a shorter \`length\`, ${options.sliding.window !== undefined && options.sliding.window < modelWindow ? 'use a larger `sliding.window`, ' : ''}or use a model with a larger input context.`
      )
    }
  }

  // Ensure the overlap is not bigger than the window
  const overlap = Math.max(0, Math.min(options.sliding.overlap, Math.floor(window / 4)))

  const settings: Settings = { ...options, window, overlap, intermediateLength, maxOutputSize, capacity }

  if (options.strategy === 'sliding') {
    return slidingSummarize(original, settings, ctx)
  }

  return parallelSummarize(original, settings, ctx, 0)
}

type Settings = Options & {
  window: number
  overlap: number
  intermediateLength: number
  maxOutputSize: number
  /** Tokens one call can take besides the prompt: text, running summary and the summary it writes */
  capacity: number
}

type Step = {
  text: string
  kind: 'whole' | 'part' | 'merge'
  part?: number
  parts?: number
  length: number
}

const focusInstructions = (options: Settings) => [
  `What to keep: ${options.prompt}`,
  'Keep verbatim any markers, citations, references or identifiers in the text that the instructions above ask to keep, attached to the statements they support. Never invent, renumber or reformat them.',
  'Ignore unnecessary details and use short, concise sentences to increase information density.',
]

const summarizeStep = async (step: Step, options: Settings, ctx: ZaiContext): Promise<string> => {
  const instructions = [...focusInstructions(options)]
  let intro: string

  if (step.kind === 'whole') {
    intro = 'You are summarizing a text.'
    instructions.push(`The summary must be ${step.length} tokens or less.`)
  } else if (step.kind === 'part') {
    intro = `You are summarizing part ${step.part} of ${step.parts} of a long text. The summaries of all parts will later be merged into one summary, so cover everything this part says that matches what to keep, and do not refer to the other parts.`
    instructions.push(`The summary of this part can be up to ${step.length} tokens long.`)
  } else {
    intro =
      'You are merging the summaries of consecutive parts of one long text (in order, separated by "============") into one summary of the whole text.'
    instructions.push(
      'Combine what the parts say about the same subject, remove repetition, and keep the order that makes the summary readable.'
    )
    instructions.push(`The merged summary must be ${step.length} tokens or less.`)
  }

  instructions.push(`Reply with the summary between the tags ${START} and ${END}.`)

  return writeSummary(ctx, {
    systemPrompt: `
${intro}

IMPORTANT INSTRUCTIONS:
${instructions.map((x) => `- ${x.trim()}`).join('\n')}

FORMAT OF THE SUMMARY:
${options.format}
`.trim(),
    content: `<|start_text|>\n${step.text}\n<|end_text|>\n\nWrite the summary now, starting with ${START}.`,
    length: step.length,
    maxOutputSize: options.maxOutputSize,
  })
}

/**
 * Summarizes text that fits one window in one call. Longer text is cut into the fewest equal parts that fit a
 * window, the parts are summarized at the same time, and their summaries are merged (again in parallel, by groups
 * that fit a window, until one summary is left).
 */
const parallelSummarize = async (
  text: string,
  options: Settings,
  ctx: ZaiContext,
  depth: number,
  previousTokens: number = Infinity
): Promise<string> => {
  ctx.controller.signal.throwIfAborted()
  const tokenizer = await getTokenizer()
  const tokens = tokenizer.split(text)

  if (tokens.length <= options.window) {
    return summarizeStep({ text, kind: depth === 0 ? 'whole' : 'merge', length: options.length }, options, ctx)
  }

  if (depth >= options.maxIterations) {
    throw new Error(`The summary did not converge after ${options.maxIterations} rounds of merging`)
  }

  // Every round must make the text shorter, or merging would go on without end
  if (tokens.length >= previousTokens) {
    throw new Error(
      `The summary did not converge: the summaries of round ${depth} (${tokens.length} tokens) are not shorter than their text (${previousTokens} tokens). Ask for a shorter \`length\` or a larger \`sliding.window\`.`
    )
  }

  const limit = pLimit(CONCURRENCY)

  // Past the first round, the text is the summaries of the previous round: merge them in groups that each fit a
  // window, then merge the results
  const groups: string[][] = []
  if (depth > 0) {
    let current: string[] = []
    let currentTokens = 0
    for (const summary of text.split(SEPARATOR)) {
      const count = tokenizer.count(summary)
      if (current.length && currentTokens + count > options.window) {
        groups.push(current)
        current = []
        currentTokens = 0
      }
      current.push(summary)
      currentTokens += count
    }
    if (current.length) {
      groups.push(current)
    }
  }

  if (groups.length < 2) {
    // The first round, or a single summary larger than a window: cut the text into the fewest equal parts that fit
    const parts = Math.ceil(tokens.length / Math.max(1, options.window - 2 * options.overlap))
    const partSize = Math.ceil(tokens.length / parts)
    const slices = Array.from({ length: parts }, (_, i) =>
      tokens.slice(Math.max(0, i * partSize - options.overlap), (i + 1) * partSize + options.overlap).join('')
    )

    // Each part's summary gets its share of a merge call's window, so the merge usually takes one call
    const partLength = Math.min(
      options.intermediateLength,
      Math.max(options.length, Math.floor(options.window / parts) - 50)
    )

    const summaries = await allOrAbort(
      ctx,
      slices.map((slice, i) =>
        limit(() => summarizeStep({ text: slice, kind: 'part', part: i + 1, parts, length: partLength }, options, ctx))
      )
    )
    return parallelSummarize(summaries.join(SEPARATOR), options, ctx, depth + 1, tokens.length)
  }

  // A merge must be short enough that the next round's window takes several of them
  const mergeLength = Math.max(
    options.length,
    Math.min(options.intermediateLength, Math.floor(options.window / MIN_SUMMARIES_PER_WINDOW))
  )

  const merged = await allOrAbort(
    ctx,
    groups.map((group) =>
      limit(() => summarizeStep({ text: group.join(SEPARATOR), kind: 'merge', length: mergeLength }, options, ctx))
    )
  )
  return parallelSummarize(merged.join(SEPARATOR), options, ctx, depth + 1, tokens.length)
}

/** Summarizes window after window, each call amending the running summary */
const slidingSummarize = async (
  original: string,
  options: Settings,
  ctx: ZaiContext,
  depth: number = 0
): Promise<string> => {
  ctx.controller.signal.throwIfAborted()
  const tokenizer = await getTokenizer()

  const format = (summary: string, newText: string) => {
    return `
${START}
${summary.length ? summary : '<summary still empty>'}
${END}

Please amend the summary between the ${START} and ${END} tags to accurately reflect the prompt and the additional text below.

<|start_new_information|>
${newText}
<|new_information|>`.trim()
  }

  const tokens = tokenizer.split(original)
  // Each call takes `window` tokens of text: `step` new tokens, after the `overlap` last tokens of the previous step
  const step = Math.max(1, options.window - options.overlap)
  const parts = Math.ceil(tokens.length / step)
  let iteration = 0

  // We split it recursively into smaller parts until we're at less than 4 window slides per part
  // Then we use a merge strategy to combine the sub-chunks summaries
  // This is basically a merge sort algorithm (but summary instead of sorting)
  const N = 2 // This is the merge sort exponent
  const useMergeSort = parts >= Math.pow(2, N)
  const chunkSize = Math.ceil(tokens.length / (parts * N))

  if (useMergeSort) {
    if (depth >= options.maxIterations) {
      throw new Error(`The summary did not converge after ${options.maxIterations} rounds of merging`)
    }
    const limit = pLimit(CONCURRENCY)
    const chunks = chunk(tokens, chunkSize).map((x) => x.join(''))
    const allSummaries = await allOrAbort(
      ctx,
      chunks.map((chunk) => limit(() => slidingSummarize(chunk, options, ctx, depth + 1)))
    )
    const joined = allSummaries.join(SEPARATOR)
    // Every round must make the text shorter, or merging would go on without end
    if (tokenizer.count(joined) >= tokens.length) {
      throw new Error(
        `The summary did not converge: the summaries of the parts are not shorter than the text (${tokens.length} tokens). Ask for a shorter \`length\` or a larger \`sliding.window\`.`
      )
    }
    return slidingSummarize(joined, options, ctx, depth + 1)
  }

  let currentSummary = ''

  // The running summary is sent with every window: it may grow, up to what the context has room for beside the window
  const summaryCap = Math.min(
    options.maxOutputSize,
    Math.max(options.intermediateLength, Math.floor((options.capacity - options.window) / (1 + OUTPUT_HEADROOM)))
  )

  for (let i = 0; i < tokens.length; i += step) {
    const from = Math.max(0, i - options.overlap)
    const to = Math.min(tokens.length, i + step)
    const isFirst = i === 0
    const isLast = to >= tokens.length

    const slice = tokens.slice(from, to).join('')

    if (iteration++ >= options.maxIterations) {
      break
    }

    const instructions: string[] = [
      `At each step, you will receive a part of the text to summarize. Make sure to reply with the new summary in the tags ${START} and ${END}.`,
      'Summarize the text and make sure that the main points are included.',
      ...focusInstructions(options),
    ]

    if (isFirst) {
      instructions.push(
        'The current summary is empty. You need to generate a summary that covers the main points of the text.'
      )
    }

    let generationLength = options.length
    const currentSummaryTokens = tokenizer.count(currentSummary)

    if (!isLast) {
      generationLength = Math.min(currentSummaryTokens + options.intermediateLength, summaryCap)

      instructions.push(
        'You need to amend the summary to include the new information. Make sure the summary is complete and covers all the main points.'
      )

      instructions.push(`The current summary is ${currentSummaryTokens} tokens long.`)
      instructions.push(`You can amend the summary to be up to ${generationLength} tokens long.`)
    }

    if (isLast) {
      instructions.push(
        'This is the last part you will have to summarize. Make sure the summary is complete and covers all the main points.'
      )
      instructions.push(
        `The current summary is ${currentSummaryTokens} tokens long. You need to make sure it is ${options.length} tokens or less.`
      )

      if (currentSummaryTokens > options.length) {
        instructions.push(
          `The current summary is already too long, so you need to shorten it to ${options.length} tokens while also including the new information.`
        )
      }
    }

    currentSummary = await writeSummary(ctx, {
      systemPrompt: `
You are summarizing a text. The text is split into ${parts} parts, and you are currently working on part ${iteration}.
At every step, you will receive the current summary and a new part of the text. You need to amend the summary to include the new information (if needed).
The summary needs to cover the main points of the text and must be concise.

IMPORTANT INSTRUCTIONS:
${instructions.map((x) => `- ${x.trim()}`).join('\n')}

FORMAT OF THE SUMMARY:
${options.format}
`.trim(),
      content: format(currentSummary, slice),
      length: generationLength,
      maxOutputSize: options.maxOutputSize,
    })
  }

  return currentSummary.trim()
}

Zai.prototype.summarize = function (this: Zai, original, _options): Response<string> {
  const options = Options.parse(_options ?? {}) as Options

  const context = this._context('summarize')

  return new Response<string, string>(context, summarize(original, options, context), (value) => value)
}
