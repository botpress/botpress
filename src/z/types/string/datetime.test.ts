import { it, describe, expect } from 'vitest'
import { generateDatetimeRegex, extractPrecisionAndOffset } from './datetime'

describe.concurrent('datetime tests', () => {
  describe.concurrent('extractPrecisionAndOffset', () => {
    it.each([
      { precision: 0, offset: false },
      { precision: 2, offset: false },
      { precision: null, offset: false },
      { precision: 0, offset: true },
      { precision: 2, offset: true },
      { precision: null, offset: true },
    ])(
      'should correctly extract { precision: $precision, offset: $offset } from a datetime regex',
      ({ precision, offset }) => {
        // Arrange
        const dateTimeRegex = generateDatetimeRegex({ precision, offset })

        // Act
        const result = extractPrecisionAndOffset(dateTimeRegex.source)

        // Assert
        expect(result).toEqual({ precision, offset })
      },
    )
  })
})
