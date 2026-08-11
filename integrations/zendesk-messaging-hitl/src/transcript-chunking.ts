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
 * Reserved on the first part so that prepending the header — and, when the
 * transcript was truncated, the omission notice — can never push it over the limit.
 */
const FIRST_PART_RESERVED = TRANSCRIPT_HEADER.length + OMISSION_NOTICE.length

/**
 * Splits text into chunks of at most `maxLength`, preferring turn boundaries so a
 * single message is not cut mid-sentence. A turn too long to fit on its own is
 * hard-split, since there is no boundary to fall back on.
 */
export const splitIntoChunks = (text: string, maxLength: number): string[] => {
  if (maxLength <= 0) {
    throw new Error(`maxLength must be positive, got ${maxLength}`)
  }

  const chunks: string[] = []
  let current = ''

  const flush = () => {
    if (current.length > 0) {
      chunks.push(current)
      current = ''
    }
  }

  for (const turn of text.split(TURN_SEPARATOR)) {
    if (turn.length > maxLength) {
      flush()
      for (let offset = 0; offset < turn.length; offset += maxLength) {
        chunks.push(turn.slice(offset, offset + maxLength))
      }
      continue
    }

    const candidate = current.length > 0 ? `${current}${TURN_SEPARATOR}${turn}` : turn

    if (candidate.length > maxLength) {
      flush()
      current = turn
    } else {
      current = candidate
    }
  }

  flush()

  return chunks
}

/**
 * Turns a transcript into Sunco-sized message texts.
 *
 * When the transcript needs more than `MAX_TRANSCRIPT_PARTS` messages the oldest
 * chunks are dropped rather than the newest — an agent picking up the handover
 * needs the end of the conversation far more than its beginning.
 */
export const buildTranscriptParts = (
  transcript: string,
  options: { maxLength?: number; maxParts?: number } = {}
): string[] => {
  const { maxLength = SUNCO_MAX_MESSAGE_LENGTH, maxParts = MAX_TRANSCRIPT_PARTS } = options

  const chunks = splitIntoChunks(transcript.trim(), maxLength - FIRST_PART_RESERVED)

  if (chunks.length === 0) {
    return [`${TRANSCRIPT_HEADER}(No messages)`]
  }

  const truncated = chunks.length > maxParts
  const kept = truncated ? chunks.slice(-maxParts) : chunks

  return kept.map((chunk, index) =>
    index === 0 ? `${TRANSCRIPT_HEADER}${truncated ? OMISSION_NOTICE : ''}${chunk}` : chunk
  )
}
