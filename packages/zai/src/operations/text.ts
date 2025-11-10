// eslint-disable consistent-type-definitions
import { z } from '@bpinternal/zui'

import { clamp } from 'lodash-es'
import { ZaiContext } from '../context'
import { Response } from '../response'
import { getTokenizer } from '../tokenizer'
import { Zai } from '../zai'
import { PROMPT_INPUT_BUFFER, PROMPT_OUTPUT_BUFFER } from './constants'

export type Options = {
  /** The maximum number of tokens to generate */
  length?: number
}

const Options = z.object({
  length: z.number().min(1).max(100_000).optional().describe('The maximum number of tokens to generate'),
})

declare module '@botpress/zai' {
  interface Zai {
    /**
     * Generates text content based on a natural language prompt.
     *
     * This operation creates original text content using LLMs with optional length constraints.
     * Perfect for generating descriptions, emails, articles, creative content, and more.
     *
     * @param prompt - Natural language description of what text to generate
     * @param options - Optional configuration for text length
     * @returns Response promise resolving to the generated text
     *
     * @example Product description
     * ```typescript
     * const description = await zai.text(
     *   'Write a compelling product description for eco-friendly bamboo toothbrushes'
     * )
     * ```
     *
     * @example With length constraint
     * ```typescript
     * const tagline = await zai.text(
     *   'Create a catchy tagline for a fitness app',
     *   { length: 10 } // ~10 tokens (7-8 words)
     * )
     * ```
     *
     * @example Email generation
     * ```typescript
     * const email = await zai.text(`
     *   Write a professional email to a customer explaining
     *   that their order will be delayed by 2 days due to weather.
     *   Apologize and offer a 10% discount on their next purchase.
     * `, { length: 150 })
     * ```
     *
     * @example Blog post
     * ```typescript
     * const blogPost = await zai.text(`
     *   Write an informative blog post about the benefits of meditation
     *   for software developers. Include practical tips and scientific research.
     * `, { length: 500 })
     * ```
     *
     * @example Social media content
     * ```typescript
     * const tweet = await zai.text(
     *   'Write an engaging tweet announcing our new AI-powered chatbot feature',
     *   { length: 30 } // Twitter-friendly length
     * )
     * ```
     */
    text(prompt: string, options?: Options): Response<string>
  }
}

const text = async (prompt: string, _options: Options | undefined, ctx: ZaiContext): Promise<string> => {
  ctx.controller.signal.throwIfAborted()
  const options = Options.parse(_options ?? {})
  const tokenizer = await getTokenizer()
  const model = await ctx.getModel()

  prompt = tokenizer.truncate(prompt, Math.max(model.input.maxTokens - PROMPT_INPUT_BUFFER, 100))

  if (options.length) {
    options.length = Math.min(model.output.maxTokens - PROMPT_OUTPUT_BUFFER, options.length)
  }

  const instructions: string[] = []
  let chart = ''

  if (options.length) {
    const length = clamp(options.length * 0.75, 5, options.length)
    instructions.push(`IMPORTANT: Length constraint: ${length} tokens/words`)
    instructions.push(`The text must be standalone and complete in less than ${length} tokens/words`)
  }

  if (options.length && options.length <= 500) {
    chart = `
| Tokens      | Text Length (approximate)            |
|-------------|--------------------------------------|
| < 5 tokens  | 1-3 words                            |
| 5-10 tokens | 3-6 words                            |
| 10-20 tokens| 6-15 words                           |
| 20-50 tokens| A short sentence (15-30 words)       |
| 50-100 tokens| A medium sentence (30-70 words)     |
| 100-200 tokens| A short paragraph (70-150 words)   |
| 200-300 tokens| A medium paragraph (150-200 words) |
| 300-500 tokens| A long paragraph (200-300 words)   |`.trim()
  }

  const { extracted } = await ctx.generateContent({
    systemPrompt: `
Generate a text that fulfills the user prompt below. Answer directly to the prompt, without any acknowledgements or fluff. Also, make sure the text is standalone and complete.
${instructions.map((x) => `- ${x}`).join('\n')}
${chart}
`.trim(),
    temperature: 0.7,
    messages: [{ type: 'text', content: prompt, role: 'user' }],
    transform: (text) => {
      if (!text.trim().length) {
        throw new Error('The model did not return a valid summary. The response was empty.')
      }

      return text
    },
  })

  return extracted
}

Zai.prototype.text = function (this: Zai, prompt: string, _options?: Options): Response<string> {
  const context = new ZaiContext({
    client: this.client,
    modelId: this.Model,
    taskId: this.taskId,
    taskType: 'zai.text',
    adapter: this.adapter,
  })

  return new Response<string>(context, text(prompt, _options, context), (result) => result)
}
