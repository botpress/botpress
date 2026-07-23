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
