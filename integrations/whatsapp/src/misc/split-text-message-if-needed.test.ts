import { describe, it, expect } from 'vitest'
import { splitTextMessageIfNeeded } from './split-text-message'

const WHATSAPP_MAX_TEXT_LENGTH = 4096

describe('splitTextMessageIfNeeded', () => {
  describe('Messages within limit', () => {
    it('should return a single string for empty string', () => {
      const result = splitTextMessageIfNeeded('')
      expect(result).toHaveLength(1)
      expect(result[0]).toBe('')
      expect(typeof result[0]).toBe('string')
    })

    it('should return a single string for short message', () => {
      const message = 'Hello, world!'
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(1)
      expect(typeof result[0]).toBe('string')
      expect(result[0]).toBe(message)
    })

    it('should return a single string for message at exact limit', () => {
      const message = 'a'.repeat(WHATSAPP_MAX_TEXT_LENGTH)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(1)
      expect(typeof result[0]).toBe('string')
      expect(result[0]).toBe(message)
      expect(result[0]!.length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
    })
  })

  describe('Messages exceeding limit', () => {
    it('should split message that is one character over limit', () => {
      const message = 'a'.repeat(WHATSAPP_MAX_TEXT_LENGTH + 1)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(2)
      expect(typeof result[0]).toBe('string')
      expect(typeof result[1]).toBe('string')
      expect(result[0]!.length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(result[1]!.length).toBe(1)
      expect(result[0]! + result[1]!).toBe(message)
    })

    it('should split message that is exactly double the limit', () => {
      const message = 'a'.repeat(WHATSAPP_MAX_TEXT_LENGTH * 2)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(2)
      expect(typeof result[0]).toBe('string')
      expect(typeof result[1]).toBe('string')
      expect(result[0]!.length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(result[1]!.length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(result[0]! + result[1]!).toBe(message)
    })

    it('should split message that requires multiple chunks', () => {
      const message = 'a'.repeat(WHATSAPP_MAX_TEXT_LENGTH * 3 + 100)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(4)
      for (const chunk of result) {
        expect(typeof chunk).toBe('string')
      }
      expect(result[0]!.length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(result[1]!.length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(result[2]!.length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(result[3]!.length).toBe(100)
      expect(result.join('')).toBe(message)
    })

    it('should split large message correctly', () => {
      const message = 'b'.repeat(10000)
      const result = splitTextMessageIfNeeded(message)
      const expectedChunks = Math.ceil(10000 / WHATSAPP_MAX_TEXT_LENGTH)
      expect(result).toHaveLength(expectedChunks)
      for (const chunk of result) {
        expect(typeof chunk).toBe('string')
        expect(chunk.length).toBeLessThanOrEqual(WHATSAPP_MAX_TEXT_LENGTH)
      }
      expect(result.join('')).toBe(message)
    })
  })

  describe('Message content preservation', () => {
    it('should preserve message content exactly when splitting', () => {
      const message = 'Hello, this is a test message! ' + 'x'.repeat(WHATSAPP_MAX_TEXT_LENGTH)
      const result = splitTextMessageIfNeeded(message)
      const reconstructed = result.join('')
      expect(reconstructed).toBe(message)
    })

    it('should handle unicode characters correctly', () => {
      const message = 'Hello 世界 🌍 ' + 'é'.repeat(WHATSAPP_MAX_TEXT_LENGTH)
      const result = splitTextMessageIfNeeded(message)
      const reconstructed = result.join('')
      expect(reconstructed).toBe(message)
    })

    it('should handle newlines and special characters', () => {
      const baseMessage = 'Line 1\nLine 2\nLine 3\n' + 'Special: !@#$%^&*()'
      const message = baseMessage + 'x'.repeat(WHATSAPP_MAX_TEXT_LENGTH)
      const result = splitTextMessageIfNeeded(message)
      const reconstructed = result.join('')
      expect(reconstructed).toBe(message)
    })
  })

  describe('Edge cases', () => {
    it('should handle message that is exactly limit minus one', () => {
      const message = 'a'.repeat(WHATSAPP_MAX_TEXT_LENGTH - 1)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(1)
      expect(result[0]!.length).toBe(WHATSAPP_MAX_TEXT_LENGTH - 1)
    })

    it('should handle message that is exactly limit plus one', () => {
      const message = 'a'.repeat(WHATSAPP_MAX_TEXT_LENGTH + 1)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(2)
      expect(result[0]!.length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(result[1]!.length).toBe(1)
    })

    it('should handle very large message (10x limit)', () => {
      const message = 'c'.repeat(WHATSAPP_MAX_TEXT_LENGTH * 10)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(10)
      for (const chunk of result) {
        expect(typeof chunk).toBe('string')
        expect(chunk.length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      }
      expect(result.join('')).toBe(message)
    })

    it('should handle message with exactly 2x limit plus one', () => {
      const message = 'd'.repeat(WHATSAPP_MAX_TEXT_LENGTH * 2 + 1)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(3)
      expect(result[0]!.length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(result[1]!.length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(result[2]!.length).toBe(1)
      expect(result.join('')).toBe(message)
    })
  })
})
