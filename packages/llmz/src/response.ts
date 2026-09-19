import type { MessageDeltaHandler, ResponseHandler } from './chat.js'

export type ResponsePreset = 'markdown' | 'text' | 'speech'

export type Response =
  | ResponsePreset
  | {
      preset?: ResponsePreset
      instructions?: string
      examples?: string[]
      handler?: ResponseHandler
      onDelta?: MessageDeltaHandler
    }

export type ResolvedResponse = {
  instructions: string
  examples: string[]
  handler?: ResponseHandler
  onDelta?: MessageDeltaHandler
}

const presets: Record<ResponsePreset, ResolvedResponse> = {
  markdown: {
    instructions:
      'Write natural Markdown directly in the assistant response. Use paragraphs, lists, links, and code blocks where useful. Do not wrap the entire response in JSON or a Markdown fence.',
    examples: [
      `To reset your password:

1. Open the sign-in page and select **Forgot password?**
2. Enter the email address you use for your account.
3. Open the reset link in your email and choose a new password.

If the email does not arrive, check your spam folder. If you sign in through your organization, use its password reset process.`,
      'How do you currently manage board meetings?',
    ],
  },
  text: {
    instructions:
      'Write plain text directly in the assistant response. Use natural sentences and paragraph breaks. Do not use Markdown formatting, headings, tables, or code fences.',
    examples: ['Your invoice has been paid. You can find the receipt in your account settings.'],
  },
  speech: {
    instructions:
      'Write plain conversational prose for text-to-speech. Use short sentences that sound natural when spoken. Do not use Markdown, links, URLs, emojis, code, bullet points, tables, or headings. Spell out numbers, dates, units, and abbreviations as they should be pronounced.',
    examples: ['Your order shipped this morning and should arrive on Tuesday, June third, around noon.'],
  },
}

/** Resolve one response style for the entire generation, including its stream. */
export function resolveResponse(response: Response = 'markdown'): ResolvedResponse {
  const config: Exclude<Response, string> = typeof response === 'string' ? { preset: response } : response

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError('Chat response must be a preset or a response configuration.')
  }

  if (Object.keys(config).some((key) => !['preset', 'instructions', 'examples', 'handler', 'onDelta'].includes(key))) {
    throw new TypeError('Chat response only accepts preset, instructions, examples, handler, and onDelta.')
  }

  if (config.preset !== undefined && (typeof config.preset !== 'string' || !Object.hasOwn(presets, config.preset))) {
    throw new TypeError('Chat response preset must be "markdown", "text", or "speech".')
  }

  if (config.instructions !== undefined && (typeof config.instructions !== 'string' || !config.instructions.trim())) {
    throw new TypeError('Chat response instructions must be a non-empty string.')
  }

  if (
    config.examples !== undefined &&
    (!Array.isArray(config.examples) ||
      config.examples.some((example) => typeof example !== 'string' || !example.trim()))
  ) {
    throw new TypeError('Chat response examples must be an array of non-empty strings.')
  }

  for (const key of ['handler', 'onDelta'] as const) {
    if (config[key] !== undefined && typeof config[key] !== 'function') {
      throw new TypeError(`Chat response ${key} must be a function.`)
    }
  }

  const presetName = config.preset ?? (config.instructions === undefined ? 'markdown' : undefined)
  const preset = presetName === undefined ? undefined : presets[presetName]

  return {
    instructions: [preset?.instructions, config.instructions?.trim()].filter(Boolean).join('\n\n'),
    examples: [...(config.examples ?? preset?.examples ?? [])],
    ...(config.handler === undefined ? {} : { handler: config.handler }),
    ...(config.onDelta === undefined ? {} : { onDelta: config.onDelta }),
  }
}
