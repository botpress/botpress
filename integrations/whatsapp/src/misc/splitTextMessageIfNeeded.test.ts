import { describe, it, expect } from 'vitest'
import { Text } from 'whatsapp-api-js/messages'
import { splitTextMessageIfNeeded } from './split-text-message'

const WHATSAPP_MAX_TEXT_LENGTH = 4096

function getTextContent(message: Text): string {
  return (message as any).text || (message as any).body || ''
}

describe('splitTextMessageIfNeeded', () => {
  describe('Messages within limit', () => {
    it('should return a single Text message for empty string', () => {
      const result = splitTextMessageIfNeeded('')
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(Text)
      expect(getTextContent(result[0] as Text)).toBe('')
    })

    it('should return a single Text message for short message', () => {
      const message = 'Hello, world!'
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(Text)
      expect(getTextContent(result[0] as Text)).toBe(message)
    })

    it('should return a single Text message for message at exact limit', () => {
      const message = 'a'.repeat(WHATSAPP_MAX_TEXT_LENGTH)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(Text)
      const textContent = getTextContent(result[0] as Text)
      expect(textContent).toBe(message)
      expect(textContent.length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
    })
  })

  describe('Messages exceeding limit', () => {
    it('should split message that is one character over limit', () => {
      const message = 'a'.repeat(WHATSAPP_MAX_TEXT_LENGTH + 1)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Text)
      expect(result[1]).toBeInstanceOf(Text)
      const text0 = getTextContent(result[0] as Text)
      const text1 = getTextContent(result[1] as Text)
      expect(text0.length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(text1.length).toBe(1)
      expect(text0 + text1).toBe(message)
    })

    it('should split message that is exactly double the limit', () => {
      const message = 'a'.repeat(WHATSAPP_MAX_TEXT_LENGTH * 2)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Text)
      expect(result[1]).toBeInstanceOf(Text)
      const text0 = getTextContent(result[0] as Text)
      const text1 = getTextContent(result[1] as Text)
      expect(text0.length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(text1.length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(text0 + text1).toBe(message)
    })

    it('should split message that requires multiple chunks', () => {
      const message = 'a'.repeat(WHATSAPP_MAX_TEXT_LENGTH * 3 + 100)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(4)
      result.forEach((chunk) => {
        expect(chunk).toBeInstanceOf(Text)
      })
      expect(getTextContent(result[0] as Text).length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(getTextContent(result[1] as Text).length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(getTextContent(result[2] as Text).length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(getTextContent(result[3] as Text).length).toBe(100)
      expect(result.map((chunk) => getTextContent(chunk as Text)).join('')).toBe(message)
    })

    it('should split large message correctly', () => {
      const message = 'b'.repeat(10000)
      const result = splitTextMessageIfNeeded(message)
      const expectedChunks = Math.ceil(10000 / WHATSAPP_MAX_TEXT_LENGTH)
      expect(result).toHaveLength(expectedChunks)
      result.forEach((chunk) => {
        expect(chunk).toBeInstanceOf(Text)
        expect(getTextContent(chunk as Text).length).toBeLessThanOrEqual(WHATSAPP_MAX_TEXT_LENGTH)
      })
      expect(result.map((chunk) => getTextContent(chunk as Text)).join('')).toBe(message)
    })
  })

  describe('Message content preservation', () => {
    it('should preserve message content exactly when splitting', () => {
      const message = 'Hello, this is a test message! ' + 'x'.repeat(WHATSAPP_MAX_TEXT_LENGTH)
      const result = splitTextMessageIfNeeded(message)
      const reconstructed = result.map((chunk) => getTextContent(chunk as Text)).join('')
      expect(reconstructed).toBe(message)
    })

    it('should handle unicode characters correctly', () => {
      const message = 'Hello 世界 🌍 ' + 'é'.repeat(WHATSAPP_MAX_TEXT_LENGTH)
      const result = splitTextMessageIfNeeded(message)
      const reconstructed = result.map((chunk) => getTextContent(chunk as Text)).join('')
      expect(reconstructed).toBe(message)
    })

    it('should handle newlines and special characters', () => {
      const baseMessage = 'Line 1\nLine 2\nLine 3\n' + 'Special: !@#$%^&*()'
      const message = baseMessage + 'x'.repeat(WHATSAPP_MAX_TEXT_LENGTH)
      const result = splitTextMessageIfNeeded(message)
      const reconstructed = result.map((chunk) => getTextContent(chunk as Text)).join('')
      expect(reconstructed).toBe(message)
    })
  })

  describe('Edge cases', () => {
    it('should handle message that is exactly limit minus one', () => {
      const message = 'a'.repeat(WHATSAPP_MAX_TEXT_LENGTH - 1)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(1)
      expect(getTextContent(result[0] as Text).length).toBe(WHATSAPP_MAX_TEXT_LENGTH - 1)
    })

    it('should handle message that is exactly limit plus one', () => {
      const message = 'a'.repeat(WHATSAPP_MAX_TEXT_LENGTH + 1)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(2)
      expect(getTextContent(result[0] as Text).length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(getTextContent(result[1] as Text).length).toBe(1)
    })

    it('should handle very large message (10x limit)', () => {
      const message = 'c'.repeat(WHATSAPP_MAX_TEXT_LENGTH * 10)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(10)
      result.forEach((chunk) => {
        expect(chunk).toBeInstanceOf(Text)
        expect(getTextContent(chunk as Text).length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      })
      expect(result.map((chunk) => getTextContent(chunk as Text)).join('')).toBe(message)
    })

    it('should handle message with exactly 2x limit plus one', () => {
      const message = 'd'.repeat(WHATSAPP_MAX_TEXT_LENGTH * 2 + 1)
      const result = splitTextMessageIfNeeded(message)
      expect(result).toHaveLength(3)
      expect(getTextContent(result[0] as Text).length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(getTextContent(result[1] as Text).length).toBe(WHATSAPP_MAX_TEXT_LENGTH)
      expect(getTextContent(result[2] as Text).length).toBe(1)
      expect(result.map((chunk) => getTextContent(chunk as Text)).join('')).toBe(message)
    })
  })
})
