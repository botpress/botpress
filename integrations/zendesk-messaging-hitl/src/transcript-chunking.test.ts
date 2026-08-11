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

  it('honours custom limits', () => {
    const transcript = Array.from({ length: 50 }, (_, i) => turn(`Bot${i}`, 100)).join('\n\n')
    const parts = buildTranscriptParts(transcript, { maxLength: 400, maxParts: 3 })

    expect(parts).toHaveLength(3)
    for (const part of parts) {
      expect(part.length).toBeLessThanOrEqual(400)
    }
  })
})
