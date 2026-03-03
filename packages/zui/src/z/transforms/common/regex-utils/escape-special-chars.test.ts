import { describe, test, expect } from 'vitest'
import { escapeSpecialChars } from './escape-special-chars'

describe.concurrent('escapeSpecialChars', () => {
  test('should not modify a string with no special characters', () => {
    // Arrange
    const input = 'abcABC123'

    // Act
    const result = escapeSpecialChars(input)

    // Assert
    expect(result).toStrictEqual('abcABC123')
  })

  describe.concurrent('possible attack vectors', () => {
    test.each([
      ['.', '\\.'],
      ['*', '\\*'],
      ['+', '\\+'],
      ['?', '\\?'],
      ['^', '\\^'],
      ['$', '\\$'],
      ['{', '\\{'],
      ['}', '\\}'],
      ['(', '\\('],
      [')', '\\)'],
      ['|', '\\|'],
      ['[', '\\['],
      [']', '\\]'],
      ['\\', '\\\\'],
    ])('should escape the special character %s', (input, expected) => {
      // Act
      const result = escapeSpecialChars(input)

      // Assert
      expect(result).toStrictEqual(expected)
    })

    test.each([
      ['a.b', 'a\\.b'],
      ['a*b', 'a\\*b'],
      ['a+b', 'a\\+b'],
      ['a?b', 'a\\?b'],
      ['a^b', 'a\\^b'],
      ['a$b', 'a\\$b'],
      ['a{b', 'a\\{b'],
      ['a}b', 'a\\}b'],
      ['a(b', 'a\\(b'],
      ['a)b', 'a\\)b'],
      ['a|b', 'a\\|b'],
      ['a[b', 'a\\[b'],
      ['a]b', 'a\\]b'],
      ['a\\b', 'a\\\\b'],
    ])('should escape the special character in %s', (input, expected) => {
      // Act
      const result = escapeSpecialChars(input)

      // Assert
      expect(result).toStrictEqual(expected)
    })

    test('should escape multiple different special characters', () => {
      // Arrange
      const input = 'a.b*c(d)'
      const expected = 'a\\.b\\*c\\(d\\)'

      // Act
      const result = escapeSpecialChars(input)

      // Assert
      expect(result).toStrictEqual(expected)
    })

    test('should escape multiple instances of the same special character', () => {
      // Arrange
      const input = 'a..b**c'
      const expected = 'a\\.\\.b\\*\\*c'

      // Act
      const result = escapeSpecialChars(input)

      // Assert
      expect(result).toStrictEqual(expected)
    })

    test('should handle complex regex patterns correctly', () => {
      // Arrange
      const input = '(foo|bar)+[a-z]?\\d{2,5}'
      const expected = '\\(foo\\|bar\\)\\+\\[a-z\\]\\?\\\\d\\{2,5\\}'

      // Act
      const result = escapeSpecialChars(input)

      // Assert
      expect(result).toStrictEqual(expected)
    })

    test('should handle strings with newlines and other whitespace correctly', () => {
      // Arrange
      const input = 'line1\nline2\t[tab].+'
      const expected = 'line1\nline2\t\\[tab\\]\\.\\+'

      // Act
      const result = escapeSpecialChars(input)

      // Assert
      expect(result).toStrictEqual(expected)
    })
  })

  describe.concurrent('Unicode compatibility & miscellaneous shenanigans', () => {
    test('should leave non-problematic non-ASCII characters untouched', () => {
      // Arrange
      const input = 'äöü.éàè*ñ'
      const expected = 'äöü\\.éàè\\*ñ'

      // Act
      const result = escapeSpecialChars(input)

      // Assert
      expect(result).toStrictEqual(expected)
    })

    test('should leave emoji characters untouched', () => {
      // Arrange
      const input = '😊[test]😎.*'
      const expected = '😊\\[test\\]😎\\.\\*'

      // Act
      const result = escapeSpecialChars(input)

      // Assert
      expect(result).toStrictEqual(expected)
    })

    test('should leave surrogate pairs untouched', () => {
      // Arrange
      const input = '𐐷.𐐷' // U+10437 (DESERET SMALL YEE)
      const expected = '𐐷\\.𐐷'

      // Act
      const result = escapeSpecialChars(input)

      // Assert
      expect(result).toStrictEqual(expected)
    })

    test('should not break apart combining characters', () => {
      // Arrange
      const input = 'e\u0301.a\u0300' // é (e + combining acute) and à (a + combining grave)
      const expected = 'e\u0301\\.a\u0300'

      // Act
      const result = escapeSpecialChars(input)

      // Assert
      expect(result).toStrictEqual(expected)
    })

    test('should handle zero-width characters correctly', () => {
      // Arrange
      const input = 'test\u200B.\u200Ctest' // with zero-width space and zero-width non-joiner
      const expected = 'test\u200B\\.\u200Ctest'

      // Act
      const result = escapeSpecialChars(input)

      // Assert
      expect(result).toStrictEqual(expected)
    })

    test('should handle right-to-left marks and bidirectional text correctly', () => {
      // Arrange
      const input = 'English \u200F.אבג\u200E*' // with RTL and LTR marks
      const expected = 'English \u200F\\.אבג\u200E\\*'

      // Act
      const result = escapeSpecialChars(input)

      // Assert
      expect(result).toStrictEqual(expected)
    })
  })
})
