import { MARKER } from './types.js'

export type SanitizeOptions = {
  /** Replacement for the reserved `■` marker. Defaults to a visually similar `▪`. */
  markerReplacement?: string
}

/**
 * The protocol has no escaping mechanism by design. Any untrusted text that is
 * inserted into model context (user messages, tool results, documents) must be
 * sanitized so it cannot inject protocol blocks.
 */
export const sanitizeMessageText = (value: string, options: SanitizeOptions = {}): string =>
  value.replaceAll(MARKER, options.markerReplacement ?? '▪')

const JSON_WRAPPER_KEYS = new Set(['body', 'content', 'text', 'message'])

/**
 * Models occasionally emit a `■send` body wrapped in a single-key JSON object
 * (e.g. `{"body": "..."}` or `{"content": "..."}`) instead of plain markdown —
 * observed mostly on long replies to voice-modality turns. Message bodies are
 * never legitimately a single-key JSON object, so when the whole body parses
 * as one, return the unwrapped string. Returns undefined when the body is not
 * such a wrapper (the common case).
 */
export const unwrapJsonWrappedBody = (body: string): string | undefined => {
  const trimmed = body.trim()
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return undefined
  }

  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const keys = Object.keys(parsed)
      const value = (parsed as Record<string, unknown>)[keys[0]!]
      if (keys.length === 1 && JSON_WRAPPER_KEYS.has(keys[0]!) && typeof value === 'string') {
        return value
      }
    }
  } catch {
    // Not valid JSON: a legitimate body that merely starts with a brace
  }

  return undefined
}
