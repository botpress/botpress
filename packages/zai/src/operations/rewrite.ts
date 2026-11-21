// eslint-disable consistent-type-definitions
import { z } from '@bpinternal/zui'

import { ZaiContext } from '../context'
import { Response } from '../response'
import { getTokenizer } from '../tokenizer'
import { fastHash, stringify, takeUntilTokens } from '../utils'
import { Zai } from '../zai'
import { PROMPT_INPUT_BUFFER, PROMPT_OUTPUT_BUFFER } from './constants'

type Example = {
  input: string
  output: string
  instructions?: string
}

const _Example = z.object({
  input: z.string(),
  output: z.string(),
})

export type Options = {
  /** Examples to guide the rewriting */
  examples?: Array<Example>
  /** The maximum number of tokens to generate */
  length?: number
}

const Options = z.object({
  examples: z.array(_Example).default([]),
  length: z
    .number()
    .min(10)
    .optional()
    .describe("The maximum number of tokens to generate (capped at the model's output limit)"),
})

declare module '@botpress/zai' {
  interface Zai {
    /**
     * Rewrites text according to specific instructions while preserving the core meaning.
     *
     * This operation transforms text based on natural language instructions. Perfect for
     * tone adjustment, format conversion, translation, simplification, and style changes.
     *
     * @param original - The text to rewrite
     * @param prompt - Instructions describing how to transform the text
     * @param options - Configuration for examples and length constraints
     * @returns Response promise resolving to the rewritten text
     *
     * @example Change tone
     * ```typescript
     * const original = "Your request has been denied due to insufficient funds."
     * const friendly = await zai.rewrite(
     *   original,
     *   'Make this sound more friendly and empathetic'
     * )
     * // Result: "We appreciate your interest, but unfortunately we're unable to proceed..."
     * ```
     *
     * @example Simplify technical content
     * ```typescript
     * const technical = "The API implements RESTful architecture with OAuth 2.0 authentication..."
     * const simple = await zai.rewrite(
     *   technical,
     *   'Explain this in simple terms for non-technical users'
     * )
     * ```
     *
     * @example Professional email conversion
     * ```typescript
     * const casual = "Hey, can you send me that report? Thanks!"
     * const professional = await zai.rewrite(
     *   casual,
     *   'Rewrite this as a formal business email'
     * )
     * // Result: "Dear colleague, I would appreciate it if you could share the report..."
     * ```
     *
     * @example Format conversion
     * ```typescript
     * const paragraph = "First do this. Then do that. Finally do this other thing."
     * const bullets = await zai.rewrite(
     *   paragraph,
     *   'Convert this to a bulleted list'
     * )
     * // Result:
     * // - First do this
     * // - Then do that
     * // - Finally do this other thing
     * ```
     *
     * @example With examples for consistent style
     * ```typescript
     * const result = await zai.rewrite(
     *   original,
     *   'Rewrite in our brand voice',
     *   {
     *     examples: [
     *       {
     *         input: 'We offer many products.',
     *         output: 'Discover our curated collection of innovative solutions.'
     *       },
     *       {
     *         input: 'Contact us for help.',
     *         output: "We're here to support your success. Let's connect!"
     *       }
     *     ],
     *     length: 200 // Limit output length
     *   }
     * )
     * ```
     *
     * @example Translation-like transformation
     * ```typescript
     * const code = "if (user.isActive && user.hasPermission) { allowAccess() }"
     * const pseudocode = await zai.rewrite(
     *   code,
     *   'Convert this code to natural language pseudocode'
     * )
     * // Result: "If the user is active AND has permission, then allow access"
     * ```
     */
    rewrite(original: string, prompt: string, options?: Options): Response<string>
  }
}

const DEFAULT_START = '■START■'
const DEFAULT_END = '■END■'

/** Markers that don't appear in the given texts; the defaults unless the text itself contains them */
const pickMarkers = (...texts: string[]) => {
  for (let i = 0; ; i++) {
    const start = i === 0 ? DEFAULT_START : `■START_${i}■`
    const end = i === 0 ? DEFAULT_END : `■END_${i}■`
    if (!texts.some((t) => t.includes(start) || t.includes(end))) {
      return { START: start, END: end }
    }
  }
}

/** Shortens text to its last complete sentence when one ends in the second half, so truncation doesn't cut mid-sentence */
const trimToSentence = (text: string) => {
  const cut = Math.max(...['. ', '! ', '? ', '.\n', '!\n', '?\n', '\n\n', '。'].map((s) => text.lastIndexOf(s)))
  return cut >= text.length / 2 ? text.slice(0, cut + 1).trim() : text
}

const rewrite = async (
  original: string,
  prompt: string,
  _options: Options | undefined,
  ctx: ZaiContext
): Promise<string> => {
  ctx.controller.signal.throwIfAborted()
  const options = Options.parse(_options ?? {}) as Options
  const tokenizer = await getTokenizer()
  const model = await ctx.getModel()

  const taskId = ctx.taskId
  const taskType = 'zai.rewrite'

  const INPUT_COMPONENT_SIZE = Math.max(100, (model.input.maxTokens - PROMPT_INPUT_BUFFER) / 2)
  prompt = tokenizer.truncate(prompt, INPUT_COMPONENT_SIZE)

  const inputSize = tokenizer.count(original)
  const maxInputSize = model.input.maxTokens - tokenizer.count(prompt) - PROMPT_INPUT_BUFFER
  if (inputSize > maxInputSize) {
    throw new Error(
      `The input size is ${inputSize} tokens long, which is more than the maximum of ${maxInputSize} tokens for this model (${model.name} = ${model.input.maxTokens} tokens)`
    )
  }

  const instructions: string[] = []

  // An input that contains the markers would make the model stop early on the END stop sequence
  const { START, END } = pickMarkers(original, prompt, ...(options.examples ?? []).flatMap((e) => [e.input, e.output]))

  const originalSize = inputSize
  if (options.length) {
    options.length = Math.min(options.length, model.output.maxTokens - PROMPT_OUTPUT_BUFFER)
  }
  const generationLength = options.length
    ? Math.min(Math.max(options.length * 10, 500), model.output.maxTokens - PROMPT_OUTPUT_BUFFER)
    : undefined

  if (options.length && originalSize > options.length) {
    instructions.push(`The original text is ${originalSize} tokens long – it should be less than ${options.length}`)
    instructions.push(
      `The text must be standalone and complete in less than ${options.length} tokens, so it has to be shortened to fit the length as well`
    )
  }

  const format = (before: string, prompt: string) => {
    return `
Prompt: ${prompt}

${START}
${before}
${END}
`.trim()
  }

  const Key = fastHash(
    stringify({
      taskId,
      taskType,
      input: original,
      prompt,
      ...(options.length ? { length: options.length } : {}),
    })
  )

  const fitLength = (text: string) => {
    if (options.length && tokenizer.count(text) > options.length) {
      return trimToSentence(tokenizer.truncate(text, options.length).trim())
    }
    return text
  }

  const formatExample = ({ input, output, instructions }: Example) => {
    return [
      { type: 'text' as const, role: 'user' as const, content: format(input, instructions || prompt) },
      { type: 'text' as const, role: 'assistant' as const, content: `${START}${output}${END}` },
    ]
  }

  const defaultExamples: Example[] = [
    { input: 'Hello, how are you?', output: 'Bonjour, comment ça va?', instructions: 'translate to French' },
    { input: '1\n2\n3', output: '3\n2\n1', instructions: 'reverse the order' },
  ]

  const tableExamples =
    taskId && ctx.adapter
      ? await ctx.adapter.getExamples<string, string>({
          input: original,
          taskId,
          taskType,
        })
      : []

  const exactMatch = tableExamples.find((x) => x.key === Key)
  if (exactMatch && typeof exactMatch.output === 'string') {
    return fitLength(exactMatch.output)
  }

  const savedExamples: Example[] = [
    ...tableExamples.map((x) => ({ input: x.input as string, output: x.output as string }) satisfies Example),
    ...options.examples,
  ]

  const REMAINING_TOKENS = maxInputSize - inputSize
  const examples = takeUntilTokens(
    savedExamples.length ? savedExamples : defaultExamples,
    REMAINING_TOKENS,
    (el) => tokenizer.count(stringify(el.input)) + tokenizer.count(stringify(el.output))
  )
    .map(formatExample)
    .flat()

  const { extracted, meta } = await ctx.generateContent({
    systemPrompt: `
Rewrite the text between the ${START} and ${END} tags to match the user prompt.
${instructions.map((x) => `• ${x}`).join('\n')}
`.trim(),
    messages: [...examples, { type: 'text', content: format(original, prompt), role: 'user' }],
    stopSequences: [END],
    ...(generationLength ? { maxTokens: generationLength } : {}),
    transform: (text) => {
      let output = text ?? ''
      if (!output.trim().length) {
        throw new Error('The model did not return a valid rewrite. The response was empty.')
      }

      const startIdx = output.indexOf(START)
      if (startIdx < 0) {
        // Without the marker, any preamble ("Sure! Here is the rewrite:") would end up in the result
        throw new Error(
          `The rewritten text must start with ${START} and end with ${END}, with nothing before ${START}.`
        )
      }
      output = output.slice(startIdx + START.length)

      if (output.includes(END)) {
        output = output.slice(0, output.indexOf(END))
      }

      return output
    },
  })

  const result = fitLength(extracted.trim())

  if (taskId && ctx.adapter && !ctx.controller.signal.aborted) {
    await ctx.adapter.saveExample({
      key: Key,
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
      instructions: prompt,
      input: original,
      output: result,
      taskType,
      taskId,
    })
  }

  return result
}

Zai.prototype.rewrite = function (this: Zai, original: string, prompt: string, _options?: Options): Response<string> {
  const context = this._context('zai.rewrite')

  return new Response<string>(context, rewrite(original, prompt, _options, context), (result) => result)
}
