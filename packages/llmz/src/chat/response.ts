import { InvalidConfigurationError } from '../errors.js'
import type { MessageDeltaHandler, ResponseHandler } from './chat.js'

export type ResponsePreset = 'markdown' | 'text' | 'speech'

export type Response =
  | ResponsePreset
  | {
      preset?: ResponsePreset
      instructions?: string
      handler?: ResponseHandler
      onDelta?: MessageDeltaHandler
    }

export type ResolvedResponse = {
  instructions: string
  handler?: ResponseHandler
  onDelta?: MessageDeltaHandler
}

const presets: Record<ResponsePreset, ResolvedResponse> = {
  markdown: {
    instructions:
      'Write natural Markdown directly in the assistant response. Use paragraphs, lists, links, and code blocks where useful. Do not wrap the entire response in JSON or a Markdown fence.',
  },
  text: {
    instructions:
      'Write plain text directly in the assistant response. Use natural sentences and paragraph breaks. Do not use Markdown formatting, headings, tables, or code fences.',
  },
  speech: {
    instructions:
      'Write plain conversational prose for text-to-speech. Use short sentences that sound natural when spoken. Do not use Markdown, links, URLs, emojis, code, bullet points, tables, or headings. Spell out numbers, dates, units, and abbreviations as they should be pronounced.',
  },
}

/** Resolve one response style for the entire generation, including its stream. */
export function resolveResponse(response: Response = 'markdown'): ResolvedResponse {
  const config: Exclude<Response, string> = typeof response === 'string' ? { preset: response } : response

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new InvalidConfigurationError('Chat response must be a preset or a response configuration.')
  }

  if (Object.keys(config).some((key) => !['preset', 'instructions', 'handler', 'onDelta'].includes(key))) {
    throw new InvalidConfigurationError('Chat response only accepts preset, instructions, handler, and onDelta.')
  }

  if (config.preset !== undefined && (typeof config.preset !== 'string' || !Object.hasOwn(presets, config.preset))) {
    throw new InvalidConfigurationError('Chat response preset must be "markdown", "text", or "speech".')
  }

  if (config.instructions !== undefined && (typeof config.instructions !== 'string' || !config.instructions.trim())) {
    throw new InvalidConfigurationError('Chat response instructions must be a non-empty string.')
  }

  for (const key of ['handler', 'onDelta'] as const) {
    if (config[key] !== undefined && typeof config[key] !== 'function') {
      throw new InvalidConfigurationError(`Chat response ${key} must be a function.`)
    }
  }

  const presetName = config.preset ?? (config.instructions === undefined ? 'markdown' : undefined)
  const preset = presetName === undefined ? undefined : presets[presetName]

  return {
    instructions: [preset?.instructions, config.instructions?.trim()].filter(Boolean).join('\n\n'),
    ...(config.handler === undefined ? {} : { handler: config.handler }),
    ...(config.onDelta === undefined ? {} : { onDelta: config.onDelta }),
  }
}
