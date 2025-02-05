// eslint-disable consistent-type-definitions
import { z } from '@bpinternal/zui'

import { chunk } from 'lodash-es'
import { Zai } from '../zai'
import { PROMPT_INPUT_BUFFER, PROMPT_OUTPUT_BUFFER } from './constants'

export type Options = z.input<typeof Options>
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
  sliding: z
    .object({
      window: z.number().min(10).max(100_000),
      overlap: z.number().min(0).max(100_000),
    })
    .describe('Sliding window options')
    .default({ window: 50_000, overlap: 250 }),
})

declare module '@botpress/zai' {
  interface Zai {
    /** Summarizes a text of any length to a summary of the desired length */
    summarize(original: string, options?: Options): Promise<string>
  }
}

const START = '■START■'
const END = '■END■'

Zai.prototype.summarize = async function (this: Zai, original, _options) {
  const options = Options.parse(_options ?? {})
  const tokenizer = await this.getTokenizer()

  const INPUT_COMPONENT_SIZE = Math.max(100, (this.Model.input.maxTokens - PROMPT_INPUT_BUFFER) / 4)
  options.prompt = tokenizer.truncate(options.prompt, INPUT_COMPONENT_SIZE)
  options.format = tokenizer.truncate(options.format, INPUT_COMPONENT_SIZE)

  const maxOutputSize = this.Model.output.maxTokens - PROMPT_OUTPUT_BUFFER
  if (options.length > maxOutputSize) {
    throw new Error(
      `The desired output length is ${maxOutputSize} tokens long, which is more than the maximum of ${this.Model.output.maxTokens} tokens for this model (${this.Model.name})`
    )
  }

  // Ensure the sliding window is not bigger than the model input size
  options.sliding.window = Math.min(options.sliding.window, this.Model.input.maxTokens - PROMPT_INPUT_BUFFER)

  // Ensure the overlap is not bigger than the window
  // Most extreme case possible (all 3 same size)
  // |ooooooooooooooooooo|wwwwwwwwwwwwwww|ooooooooooooooooooo|
  // |<---- overlap ---->|<--  window -->|<---- overlap ---->|
  options.sliding.overlap = Math.min(options.sliding.overlap, options.sliding.window - 3 * options.sliding.overlap)

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
  const parts = Math.ceil(tokens.length / (options.sliding.window - options.sliding.overlap))
  let iteration = 0

  // We split it recursively into smaller parts until we're at less than 4 window slides per part
  // Then we use a merge strategy to combine the sub-chunks summaries
  // This is basically a merge sort algorithm (but summary instead of sorting)
  const N = 2 // This is the merge sort exponent
  const useMergeSort = parts >= Math.pow(2, N)
  const chunkSize = Math.ceil(tokens.length / (parts * N))

  if (useMergeSort) {
    const chunks = chunk(tokens, chunkSize).map((x) => x.join(''))
    const allSummaries = await Promise.all(chunks.map((chunk) => this.summarize(chunk, options)))
    return this.summarize(allSummaries.join('\n\n============\n\n'), options)
  }

  const summaries: string[] = []
  let currentSummary = ''

  for (let i = 0; i < tokens.length; i += options.sliding.window) {
    const from = Math.max(0, i - options.sliding.overlap)
    const to = Math.min(tokens.length, i + options.sliding.window + options.sliding.overlap)
    const isFirst = i === 0
    const isLast = to >= tokens.length

    const slice = tokens.slice(from, to).join('')

    if (iteration++ >= options.maxIterations) {
      break
    }

    const instructions: string[] = [
      `At each step, you will receive a part of the text to summarize. Make sure to reply with the new summary in the tags ${START} and ${END}.`,
      'Summarize the text and make sure that the main points are included.',
      'Ignore any unnecessary details and focus on the main points.',
      'Use short and concise sentences to increase readability and information density.',
      'When looking at the new information, focus on: ' + options.prompt,
    ]

    if (isFirst) {
      instructions.push(
        'The current summary is empty. You need to generate a summary that covers the main points of the text.'
      )
    }

    let generationLength = options.length

    if (!isLast) {
      generationLength = Math.min(
        tokenizer.count(currentSummary) + options.length * options.intermediateFactor,
        maxOutputSize
      )

      instructions.push(
        'You need to amend the summary to include the new information. Make sure the summary is complete and covers all the main points.'
      )

      instructions.push(`The current summary is ${currentSummary.length} tokens long.`)
      instructions.push(`You can amend the summary to be up to ${generationLength} tokens long.`)
    }

    if (isLast) {
      instructions.push(
        'This is the last part you will have to summarize. Make sure the summary is complete and covers all the main points.'
      )
      instructions.push(
        `The current summary is ${currentSummary.length} tokens long. You need to make sure it is ${options.length} tokens or less.`
      )

      if (currentSummary.length > options.length) {
        instructions.push(
          `The current summary is already too long, so you need to shorten it to ${options.length} tokens while also including the new information.`
        )
      }
    }

    const output = await this.callModel({
      systemPrompt: `
You are summarizing a text. The text is split into ${parts} parts, and you are currently working on part ${iteration}.
At every step, you will receive the current summary and a new part of the text. You need to amend the summary to include the new information (if needed).
The summary needs to cover the main points of the text and must be concise.

IMPORTANT INSTRUCTIONS:
${instructions.map((x) => `- ${x.trim()}`).join('\n')}

FORMAT OF THE SUMMARY:
${options.format}
`.trim(),
      messages: [{ type: 'text', content: format(currentSummary, slice), role: 'user' }],
      maxTokens: generationLength,
      stopSequences: [END],
    })

    let result = output?.choices[0]?.content as string

    if (result.includes(START)) {
      result = result.slice(result.indexOf(START) + START.length)
    }

    if (result.includes('■')) {
      // can happen if the model truncates the text before the entire END tag is written
      result = result.slice(0, result.indexOf('■'))
    }

    summaries.push(result)
    currentSummary = result
  }

  return currentSummary.trim()
}
