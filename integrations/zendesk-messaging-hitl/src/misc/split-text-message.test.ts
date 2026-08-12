import { describe, expect, it } from 'vitest'
import { splitTextMessageIfNeeded, SUNCO_MAX_TEXT_LENGTH } from './split-text-message'

describe('splitTextMessageIfNeeded', () => {
  it('keeps messages within the limit unchanged', () => {
    const message = 'a'.repeat(SUNCO_MAX_TEXT_LENGTH)

    expect(splitTextMessageIfNeeded(message)).toEqual([message])
  })

  it('splits messages exceeding the limit', () => {
    const message = 'a'.repeat(SUNCO_MAX_TEXT_LENGTH * 2 + 1)

    const chunks = splitTextMessageIfNeeded(message)

    expect(chunks).toHaveLength(3)
    expect(chunks.every((chunk) => chunk.length <= SUNCO_MAX_TEXT_LENGTH)).toBe(true)
    expect(chunks.join('')).toBe(message)
  })

  it('does not split Unicode surrogate pairs', () => {
    const message = 'a'.repeat(SUNCO_MAX_TEXT_LENGTH - 1) + '🌞' + 'b'

    const chunks = splitTextMessageIfNeeded(message)

    expect(chunks).toEqual(['a'.repeat(SUNCO_MAX_TEXT_LENGTH - 1), '🌞b'])
    expect(chunks.join('')).toBe(message)
  })
})
