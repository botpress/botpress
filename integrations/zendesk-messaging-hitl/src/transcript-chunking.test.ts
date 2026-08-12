import { describe, expect, it } from 'vitest'
import {
  buildTranscriptParts,
  splitIntoChunks,
  MAX_TRANSCRIPT_PARTS,
  OMISSION_NOTICE,
  SUNCO_MAX_MESSAGE_LENGTH,
  TRANSCRIPT_HEADER,
} from './transcript-chunking'

const turn = (label: string, length: number) => `${label}: ${'x'.repeat(Math.max(0, length - label.length - 2))}`

describe('splitIntoChunks', () => {
  it('returns a single chunk when the text already fits', () => {
    expect(splitIntoChunks('Bot: hello\n\nUser: hi', 100)).toEqual(['Bot: hello\n\nUser: hi'])
  })

  it('returns no chunks for empty text', () => {
    expect(splitIntoChunks('', 100)).toEqual([])
  })

  it('splits on turn boundaries rather than mid-sentence', () => {
    const chunks = splitIntoChunks(`${turn('Bot', 60)}\n\n${turn('User', 60)}`, 100)

    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toMatch(/^Bot: /)
    expect(chunks[1]).toMatch(/^User: /)
  })

  it('never exceeds maxLength', () => {
    const transcript = Array.from({ length: 40 }, (_, i) => turn(`Bot${i}`, 300)).join('\n\n')

    for (const chunk of splitIntoChunks(transcript, 1000)) {
      expect(chunk.length).toBeLessThanOrEqual(1000)
    }
  })

  it('hard-splits a single turn that cannot fit on its own', () => {
    const chunks = splitIntoChunks(turn('Bot', 250), 100)

    expect(chunks).toHaveLength(3)
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(100)
    }
    expect(chunks.join('')).toHaveLength(250)
  })

  it('preserves the full content when nothing is dropped', () => {
    const transcript = Array.from({ length: 10 }, (_, i) => `Bot: message ${i}`).join('\n\n')

    expect(splitIntoChunks(transcript, 50).join('\n\n')).toBe(transcript)
  })

  it('rejects a non-positive maxLength', () => {
    expect(() => splitIntoChunks('anything', 0)).toThrow(/must be positive/)
  })

  it('applies the smaller budget to the first chunk only', () => {
    const transcript = Array.from({ length: 40 }, (_, i) => turn(`Bot${i}`, 90)).join('\n\n')
    const chunks = splitIntoChunks(transcript, 500, 200)

    expect(chunks[0]!.length).toBeLessThanOrEqual(200)
    // Later chunks must get the full budget, not the reduced one.
    expect(Math.max(...chunks.slice(1).map((c) => c.length))).toBeGreaterThan(200)
    for (const chunk of chunks.slice(1)) {
      expect(chunk.length).toBeLessThanOrEqual(500)
    }
  })

  it('hard-splits an oversized turn against the per-position budget', () => {
    const chunks = splitIntoChunks(turn('Bot', 1000), 500, 200)

    expect(chunks[0]!.length).toBeLessThanOrEqual(200)
    for (const chunk of chunks.slice(1)) {
      expect(chunk.length).toBeLessThanOrEqual(500)
    }
    expect(chunks.join('')).toHaveLength(1000)
  })
})

describe('buildTranscriptParts', () => {
  it('keeps a short transcript in one part, with the header', () => {
    const parts = buildTranscriptParts('Bot: hello\n\nUser: hi')

    expect(parts).toEqual([`${TRANSCRIPT_HEADER}Bot: hello\n\nUser: hi`])
  })

  it('handles an empty transcript', () => {
    expect(buildTranscriptParts('')).toEqual([`${TRANSCRIPT_HEADER}(No messages)`])
  })

  it('keeps every part within the Sunco limit — the bug this guards', () => {
    // ~120k characters: comfortably past the point where the old single-message
    // implementation returned a 400 and aborted the handover.
    const transcript = Array.from({ length: 200 }, (_, i) => turn(`Bot${i}`, 600)).join('\n\n')
    const parts = buildTranscriptParts(transcript)

    expect(parts.length).toBeGreaterThan(1)
    for (const part of parts) {
      expect(part.length).toBeLessThanOrEqual(SUNCO_MAX_MESSAGE_LENGTH)
    }
  })

  it('caps the number of parts and flags the omission', () => {
    const transcript = Array.from({ length: 500 }, (_, i) => turn(`Bot${i}`, 600)).join('\n\n')
    const parts = buildTranscriptParts(transcript)

    expect(parts).toHaveLength(MAX_TRANSCRIPT_PARTS)
    expect(parts[0]).toContain(OMISSION_NOTICE.trim())
  })

  it('drops the oldest turns, not the newest', () => {
    const transcript = Array.from({ length: 500 }, (_, i) => turn(`Bot${i}`, 600)).join('\n\n')
    const parts = buildTranscriptParts(transcript)

    expect(parts.join('\n\n')).toContain('Bot499')
    expect(parts.join('\n\n')).not.toContain('Bot0:')
  })

  it('stays within the limit even when the omission notice is prepended', () => {
    const transcript = Array.from({ length: 500 }, (_, i) => turn(`Bot${i}`, 600)).join('\n\n')

    for (const part of buildTranscriptParts(transcript)) {
      expect(part.length).toBeLessThanOrEqual(SUNCO_MAX_MESSAGE_LENGTH)
    }
  })

  // 1362-char turns are chosen deliberately: three of them (4090 chars) fit a full
  // 4096 message but not a prefix-reserved one (3991). At turn sizes that divide
  // evenly into both budgets the reservation is invisible, which is why an earlier
  // version of these tests passed against the buggy implementation.
  const BOUNDARY_TURN_SIZE = 1362
  const boundaryTranscript = Array.from({ length: 300 }, (_, i) => turn(`Bot${i}`, BOUNDARY_TURN_SIZE)).join('\n\n')
  const RESERVED = TRANSCRIPT_HEADER.length + OMISSION_NOTICE.length

  it('does not reserve header space on chunks after the first', () => {
    const parts = buildTranscriptParts(boundaryTranscript)

    // Every part but the first should be free to use the full message budget.
    // Guards the regression where all ten parts were shrunk by the prefix size.
    expect(Math.max(...parts.slice(1).map((p) => p.length))).toBeGreaterThan(SUNCO_MAX_MESSAGE_LENGTH - RESERVED)
  })

  it('retains more of the conversation than a uniformly-reserved split would', () => {
    // Simulates the previous behaviour: every chunk shrunk by the prefix size.
    const uniform = splitIntoChunks(boundaryTranscript, SUNCO_MAX_MESSAGE_LENGTH - RESERVED)
      .slice(-MAX_TRANSCRIPT_PARTS)
      .join('').length

    const parts = buildTranscriptParts(boundaryTranscript)
    const retained = parts.join('').length - RESERVED // discount the prefix itself

    expect(retained).toBeGreaterThan(uniform)
  })

  it('keeps the first part within the limit once the prefix is applied', () => {
    // A turn sized to land right at the old boundary — the case where a naive
    // "shrink only the first chunk" fix overflows after dropping older chunks.
    for (const turnSize of [300, 600, 1000, 2048, 4000]) {
      const transcript = Array.from({ length: 300 }, (_, i) => turn(`Bot${i}`, turnSize)).join('\n\n')

      for (const part of buildTranscriptParts(transcript)) {
        expect(part.length).toBeLessThanOrEqual(SUNCO_MAX_MESSAGE_LENGTH)
      }
    }
  })

  it('survives a single turn larger than the whole transcript budget', () => {
    const parts = buildTranscriptParts(turn('Bot', 200_000))

    expect(parts).toHaveLength(MAX_TRANSCRIPT_PARTS)
    for (const part of parts) {
      expect(part.length).toBeLessThanOrEqual(SUNCO_MAX_MESSAGE_LENGTH)
    }
  })

  it('honours custom limits', () => {
    const transcript = Array.from({ length: 50 }, (_, i) => turn(`Bot${i}`, 100)).join('\n\n')
    const parts = buildTranscriptParts(transcript, { maxLength: 400, maxParts: 3 })

    expect(parts).toHaveLength(3)
    for (const part of parts) {
      expect(part.length).toBeLessThanOrEqual(400)
    }
  })
})
