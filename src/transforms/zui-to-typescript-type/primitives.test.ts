import { describe, it, expect } from 'vitest'
import { toTypescript } from '.'
import z from '../../z'

/**
 * This test file is excessively slow due to the `toBeValidTypeScript` custom matcher.
 */

function getTypingVariations(type: z.ZodType, opts?: { declaration?: boolean; maxDepth?: number }): string[] {
  const baseTypings = toTypescript(type, opts)

  const typingsNullable = toTypescript(type.nullable(), opts)

  const typingsOptional = toTypescript(type.optional(), opts)

  const typingsNullableOptional = toTypescript(type.nullable().optional(), opts)

  const typingsOptionalNullable = toTypescript(type.optional().nullable(), opts)

  const output = [baseTypings, typingsNullable, typingsOptional, typingsNullableOptional, typingsOptionalNullable]

  return output
}

describe.concurrent('primitives', () => {
  it.concurrent.each(getTypingVariations(z.string().title('MyString'), { declaration: true }))(
    'string',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.number().title('MyNumber'), { declaration: true }))(
    'number',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.bigint().title('MyBigInt'), { declaration: true }))(
    'int',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.boolean().title('MyBoolean'), { declaration: true }))(
    'boolean',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.date().title('MyDate'), { declaration: true }))(
    'date',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.undefined().title('MyUndefined'), { declaration: true }))(
    'undefined',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.null().title('MyNull'), { declaration: true }))('null', (typings) => {
    expect(typings).toBeValidTypeScript()
  })
  it.concurrent.each(getTypingVariations(z.unknown().title('MyUnknown'), { declaration: true }))(
    'unknown',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.never().title('MyNever'), { declaration: true }))(
    'never',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.nan().title('MyNaNBreadMiam'), { declaration: true }))(
    'nan',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.symbol().title('MySymbol'), { declaration: true }))(
    'symbol',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.literal('bob').title('MYLiteral'), { declaration: true }))(
    'function',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
})
