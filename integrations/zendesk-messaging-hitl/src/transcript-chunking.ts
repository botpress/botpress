/**
 * Sunshine Conversations rejects any message whose `content.text` exceeds this
 * length with a `400 bad_request`. Sending the whole transcript as one message
 * therefore aborts the entire handover on long conversations.
 */
export const SUNCO_MAX_MESSAGE_LENGTH = 4096

/**
 * Upper bound on the number of transcript messages, so a very long conversation
 * degrades to a truncated transcript instead of flooding the ticket.
 */
export const MAX_TRANSCRIPT_PARTS = 10

export const TRANSCRIPT_HEADER = 'Transcript:\n\n'
export const OMISSION_NOTICE =
  '(Earlier messages were omitted because the conversation was too long to transfer in full.)\n\n'

const TURN_SEPARATOR = '\n\n'

/**
 * Splits text into chunks, preferring turn boundaries so a single message is not
 * cut mid-sentence. A turn too long to fit in a chunk is hard-split, since there
 * is no boundary to fall back on.
 *
 * Only the first message carries the header (and, when truncated, the omission
 * notice), so only the first chunk pays for them — `firstChunkMaxLength` applies
 * to chunk 0 and `maxLength` to every chunk after it.
 */
export const splitIntoChunks = (text: string, maxLength: number, firstChunkMaxLength: number = maxLength): string[] => {
  if (maxLength <= 0 || firstChunkMaxLength <= 0) {
    throw new Error(`chunk lengths must be positive, got maxLength=${maxLength}, first=${firstChunkMaxLength}`)
  }

  const chunks: string[] = []
  let current = ''

  // The chunk being filled is the first one only while nothing has been flushed yet.
  const budget = () => (chunks.length === 0 ? firstChunkMaxLength : maxLength)

  const flush = () => {
    if (current.length > 0) {
      chunks.push(current)
      current = ''
    }
  }

  for (const turn of text.split(TURN_SEPARATOR)) {
    if (turn.length > budget()) {
      flush()
      let offset = 0
      while (offset < turn.length) {
        const size = budget()
        chunks.push(turn.slice(offset, offset + size))
        offset += size
      }
      continue
    }

    const candidate = current.length > 0 ? `${current}${TURN_SEPARATOR}${turn}` : turn

    if (candidate.length > budget()) {
      flush()
      current = turn
    } else {
      current = candidate
    }
  }

  flush()

  return chunks
}

/** Index of the oldest turn that still fits within `budget`, counting back from the newest. */
const _oldestTurnWithinBudget = (turns: string[], budget: number): number => {
  let size = 0

  for (let index = turns.length - 1; index >= 0; index--) {
    const cost = (turns[index]?.length ?? 0) + (size > 0 ? TURN_SEPARATOR.length : 0)

    if (size + cost > budget) {
      return index + 1
    }

    size += cost
  }

  return 0
}

/**
 * Turns a transcript into Sunco-sized message texts.
 *
 * When the transcript needs more than `maxParts` messages the oldest turns are
 * dropped rather than the newest — an agent picking up the handover needs the end
 * of the conversation far more than its beginning.
 *
 * Truncation is decided on turns *before* packing, not by discarding packed chunks:
 * a chunk packed at full `maxLength` could not absorb the header afterwards without
 * exceeding the limit again.
 */
export const buildTranscriptParts = (
  transcript: string,
  options: { maxLength?: number; maxParts?: number } = {}
): string[] => {
  const { maxLength = SUNCO_MAX_MESSAGE_LENGTH, maxParts = MAX_TRANSCRIPT_PARTS } = options
  const text = transcript.trim()

  if (text.length === 0) {
    return [`${TRANSCRIPT_HEADER}(No messages)`]
  }

  const whole = splitIntoChunks(text, maxLength, maxLength - TRANSCRIPT_HEADER.length)

  if (whole.length <= maxParts) {
    return whole.map((chunk, index) => (index === 0 ? `${TRANSCRIPT_HEADER}${chunk}` : chunk))
  }

  // Too long to send in full: keep the newest turns that fit, and say so.
  const prefix = `${TRANSCRIPT_HEADER}${OMISSION_NOTICE}`
  const firstChunkMaxLength = maxLength - prefix.length
  const turns = text.split(TURN_SEPARATOR)
  const pack = (from: number) => splitIntoChunks(turns.slice(from).join(TURN_SEPARATOR), maxLength, firstChunkMaxLength)

  // Start from an estimate of what maxParts messages hold, then give back turns
  // until it genuinely fits — greedy packing wastes some room at turn boundaries.
  // Never drop the newest turn: if it alone is too big it is hard-split below.
  let from = Math.min(
    _oldestTurnWithinBudget(turns, firstChunkMaxLength + (maxParts - 1) * maxLength),
    turns.length - 1
  )
  let kept = pack(from)

  while (kept.length > maxParts && from < turns.length - 1) {
    from++
    kept = pack(from)
  }

  // Degenerate case: a single turn so long that it alone needs more than maxParts
  // chunks. Nothing left to give back, so cut it down directly.
  if (kept.length > maxParts) {
    kept = kept.slice(-maxParts)
    const overflow = prefix.length + (kept[0]?.length ?? 0) - maxLength

    if (overflow > 0) {
      kept[0] = (kept[0] ?? '').slice(overflow)
    }
  }

  return kept.map((chunk, index) => (index === 0 ? `${prefix}${chunk}` : chunk))
}
