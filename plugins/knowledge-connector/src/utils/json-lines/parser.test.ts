import { describe, it, expect } from 'vitest'
import * as sdk from '@botpress/sdk'
import { parseJsonLines } from './parser'

describe.concurrent('parseJsonLines', () => {
  const STRING_SCHEMA = sdk.z.string()
  const NUMBER_SCHEMA = sdk.z.number()
  const USER_SCHEMA = sdk.z.object({
    id: sdk.z.number(),
    name: sdk.z.string(),
    email: sdk.z.string().email(),
  })

  it('should parse valid JSON lines with a string schema', () => {
    // Arrange
    const input = '"hello"\n"world"\n"test"'

    // Act
    const result = Array.from(parseJsonLines(input, STRING_SCHEMA))

    // Assert
    expect(result).toMatchObject([{ value: 'hello' }, { value: 'world' }, { value: 'test' }])
  })

  it('should parse valid JSON lines with an object schema', () => {
    // Arrange
    const input =
      '{"id": 1, "name": "John", "email": "john@example.com"}\n' +
      '{"id": 2, "name": "Jane", "email": "jane@example.com"}\n' +
      '{"id": 3, "name": "Bob", "email": "bob@example.com"}'

    // Act
    const result = Array.from(parseJsonLines(input, USER_SCHEMA))

    // Assert
    expect(result).toMatchObject([
      {
        value: { id: 1, name: 'John', email: 'john@example.com' },
      },
      {
        value: { id: 2, name: 'Jane', email: 'jane@example.com' },
      },
      { value: { id: 3, name: 'Bob', email: 'bob@example.com' } },
    ])
  })

  it('should handle empty input strings', () => {
    // Arrange
    const input = ''

    // Act
    const result = Array.from(parseJsonLines(input, STRING_SCHEMA))

    // Assert
    expect(result).toStrictEqual([])
  })

  it('should handle input with only whitespace', () => {
    // Arrange
    const input = '   \n  \n\t  '

    // Act
    const result = Array.from(parseJsonLines(input, STRING_SCHEMA))

    // Assert
    expect(result).toStrictEqual([])
  })

  it('should skip empty lines', () => {
    // Arrange
    const input = '"first"\n\n"second"\n\n\n"third"'

    // Act
    const result = Array.from(parseJsonLines(input, STRING_SCHEMA))

    // Assert
    expect(result).toMatchObject([{ value: 'first' }, { value: 'second' }, { value: 'third' }])
  })

  it('should handle trailing newlines', () => {
    // Arrange
    const input = '"line1"\n"line2"\n'

    // Act
    const result = Array.from(parseJsonLines(input, STRING_SCHEMA))

    // Assert
    expect(result).toMatchObject([{ value: 'line1' }, { value: 'line2' }])
  })

  it('should handle input without newlines', () => {
    // Arrange
    const input = '"single line"'

    // Act
    const result = Array.from(parseJsonLines(input, STRING_SCHEMA))

    // Assert
    expect(result).toMatchObject([{ value: 'single line' }])
  })

  it('should return a Zod error when a line fails Zod validation', () => {
    // Arrange
    const input = '{"id": 1, "name": "John", "email": "invalid-email"}'

    // Act
    const result = Array.from(parseJsonLines(input, USER_SCHEMA))

    // Assert
    expect(result).toMatchObject([
      { rawLine: '{"id": 1, "name": "John", "email": "invalid-email"}', error: expect.any(sdk.z.ZodError) },
    ])
  })

  it('should parse to the end, even with errors', () => {
    // Arrange
    const input = '1\n2\n"not a number"\n4'

    // Act
    const result = Array.from(parseJsonLines(input, NUMBER_SCHEMA))

    // Assert
    expect(result).toStrictEqual([
      { rawLine: '1', value: 1 },
      { rawLine: '2', value: 2 },
      { rawLine: '"not a number"', error: expect.any(sdk.z.ZodError) },
      { rawLine: '4', value: 4 },
    ])
  })

  it('should handle different line endings (CRLF)', () => {
    // Arrange
    const input = '"line1"\r\n"line2"\r\n"line3"'

    // Act
    const result = Array.from(parseJsonLines(input, STRING_SCHEMA))

    // Assert
    expect(result).toMatchObject([{ value: 'line1' }, { value: 'line2' }, { value: 'line3' }])
  })

  it('should parse properly with schema containing optional fields', () => {
    // Arrange
    const optionalSchema = sdk.z.object({
      id: sdk.z.number(),
      name: sdk.z.string(),
      age: sdk.z.number().optional(),
    })
    const input = '{"id": 1, "name": "John"}\n{"id": 2, "name": "Jane", "age": 25}'

    // Act
    const result = Array.from(parseJsonLines(input, optionalSchema))

    // Assert
    expect(result).toMatchObject([{ value: { id: 1, name: 'John' } }, { value: { id: 2, name: 'Jane', age: 25 } }])
  })
})
