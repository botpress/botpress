import { describe, expect } from 'vitest'
import { toTypescriptSchema as toTypescript } from '.'
import { evalZuiString } from '../common/eval-zui-string'

const assert = (_expected: string) => ({
  toGenerateItself: async () => {
    const schema = evalZuiString(_expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(_expected)
  },
  toThrowErrorWhenGenerating: async () => {
    const schema = evalZuiString(_expected)
    const fn = () => toTypescript(schema)
    expect(fn).toThrowError()
  },
})

describe('toTypescriptZuiString', () => {
  test('string', async () => {
    const schema = `z.string()`
    await assert(schema).toGenerateItself()
  })
  test('number', async () => {
    const schema = `z.number()`
    await assert(schema).toGenerateItself()
  })
  test('nan', async () => {
    const schema = `z.nan()`
    await assert(schema).toGenerateItself()
  })
  test('bigint', async () => {
    const schema = `z.bigint()`
    await assert(schema).toGenerateItself()
  })
  test('boolean', async () => {
    const schema = `z.boolean()`
    await assert(schema).toGenerateItself()
  })
  test('date', async () => {
    const schema = `z.date()`
    await assert(schema).toGenerateItself()
  })
  test('undefined', async () => {
    const schema = `z.undefined()`
    await assert(schema).toGenerateItself()
  })
  test('null', async () => {
    const schema = `z.null()`
    await assert(schema).toGenerateItself()
  })
  test('any', async () => {
    const schema = `z.any()`
    await assert(schema).toGenerateItself()
  })
  test('unknown', async () => {
    const schema = `z.unknown()`
    await assert(schema).toGenerateItself()
  })
  test('never', async () => {
    const schema = `z.never()`
    await assert(schema).toGenerateItself()
  })
  test('void', async () => {
    const schema = `z.void()`
    await assert(schema).toGenerateItself()
  })
  test('array', async () => {
    const schema = `z.array(z.string())`
    await assert(schema).toGenerateItself()
  })
  test('object', async () => {
    const schema = `z.object({
      a: z.string(),
      b: z.number(),
    })`
    await assert(schema).toGenerateItself()
  })
  test('union', async () => {
    const schema = `z.union([z.string(), z.number(), z.boolean()])`
    await assert(schema).toGenerateItself()
  })
  test('discriminatedUnion', async () => {
    const schema = `z.discriminatedUnion("type", [
      z.object({ type: z.literal("A"), a: z.string() }),
      z.object({ type: z.literal("B"), b: z.number() }),
    ])`
    await assert(schema).toGenerateItself()
  })
  test('intersection', async () => {
    const schema = `z.intersection(z.object({ a: z.string() }), z.object({ b: z.number() }))`
    await assert(schema).toGenerateItself()
  })
  test('tuple', async () => {
    const schema = `z.tuple([z.string(), z.number()])`
    await assert(schema).toGenerateItself()
  })
  test('record', async () => {
    const schema = `z.record(z.string(), z.number())`
    await assert(schema).toGenerateItself()
  })
  test('map', async () => {
    const schema = `z.map(z.string(), z.number())`
    await assert(schema).toGenerateItself()
  })
  test('set', async () => {
    const schema = `z.set(z.string())`
    await assert(schema).toGenerateItself()
  })
  test('function with no argument', async () => {
    const schema = `z.function().returns(z.void())`
    await assert(schema).toGenerateItself()
  })
  test('function with multiple arguments', async () => {
    const schema = `z.function().args(z.number(), z.string()).returns(z.boolean())`
    await assert(schema).toGenerateItself()
  })
  test('lazy', async () => {
    const schema = `z.lazy(() => z.string())`
    await assert(schema).toGenerateItself()
  })
  test('literal string', async () => {
    const schema = `z.literal("banana")`
    await assert(schema).toGenerateItself()
  })
  test('literal number', async () => {
    const schema = `z.literal(42)`
    await assert(schema).toGenerateItself()
  })
  test('literal boolean', async () => {
    const schema = `z.literal(true)`
    await assert(schema).toGenerateItself()
  })
  test('enum', async () => {
    const schema = `z.enum(["banana", "apple", "orange"])`
    await assert(schema).toGenerateItself()
  })
  test('effects', async () => {
    const schema = `z.string().transform((s) => s.toUpperCase())`
    await assert(schema).toThrowErrorWhenGenerating()
  })
  test('nativeEnum', async () => {
    const schema = `z.nativeEnum({
        Banana: 'banana',
        Apple: 'apple',
        Orange: 'orange',
      })
    `
    await assert(schema).toThrowErrorWhenGenerating()
  })
  test('optional', async () => {
    const schema = `z.optional(z.string())`
    await assert(schema).toGenerateItself()
  })
  test('nullable', async () => {
    const schema = `z.nullable(z.string())`
    await assert(schema).toGenerateItself()
  })
  test('default', async () => {
    const schema = `z.string().default('banana')` // TODO: should use `z.default(z.string(), 'banana')` for uniformity
    await assert(schema).toGenerateItself()
  })
  test('catch', async () => {
    const schema = `z.string().catch('banana')` // TODO: should use `z.catch(z.string(), 'banana')` for uniformity
    await assert(schema).toGenerateItself()
  })
  test('promise', async () => {
    const schema = `z.promise(z.string())`
    await assert(schema).toGenerateItself()
  })
  test('branded', async () => {
    const schema = `z.string().brand('MyString')` // TODO: should use `z.brand(z.string(), 'MyString')` for uniformity
    await assert(schema).toThrowErrorWhenGenerating()
  })
  test('pipeline', async () => {
    const schema = `z.pipeline(z.string(), z.number())`
    await assert(schema).toThrowErrorWhenGenerating()
  })
  test('symbol', async () => {
    const schema = `z.symbol()`
    await assert(schema).toThrowErrorWhenGenerating()
  })
  test('readonly', async () => {
    const schema = `z.readonly(z.string())`
    await assert(schema).toGenerateItself()
  })
  test('ref', async () => {
    const schema = `z.ref("#item")`
    await assert(schema).toGenerateItself()
  })
  test('templateLiteral', async () => {
    const schema = `z.templateLiteral()`
    await assert(schema).toThrowErrorWhenGenerating()
  })
})
