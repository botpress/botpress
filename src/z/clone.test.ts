import { test, expect } from 'vitest'
import { z } from '.'

const expectZui = (actual: z.Schema) => ({
  not: {
    toEqual: (expected: z.Schema) => {
      const result = actual.isEqual(expected)
      let msg: string | undefined = undefined
      try {
        msg = `Expected ${actual.toTypescriptSchema()} not to equal ${expected.toTypescriptSchema()}`
      } catch {}
      expect(result, msg).toBe(true)
    },
  },
  toEqual: (expected: z.Schema) => {
    const result = actual.isEqual(expected)
    let msg: string | undefined = undefined
    try {
      msg = `Expected ${actual.toTypescriptSchema()} to equal ${expected.toTypescriptSchema()}`
    } catch {}
    expect(result, msg).toBe(true)
  },
})

test('clone any', () => {
  const schema = z.any()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone array', () => {
  const schema = z.array(z.string())
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone bigint', () => {
  const schema = z.bigint()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone boolean', () => {
  const schema = z.boolean()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone branded', () => {
  const schema = z.string().brand('test')
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone catch', () => {
  const schema = z.string().catch('test')
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone custom', () => {
  const schema = z.custom()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone date', () => {
  const schema = z.date()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone default', () => {
  const schema = z.string().default('test')
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone discriminatedUnion', () => {
  const schema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('a'), value: z.string() }),
    z.object({ type: z.literal('b'), value: z.number() }),
  ])
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone enum', () => {
  const schema = z.enum(['a', 'b', 'c'])
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone function', () => {
  const schema = z.function().args(z.string()).returns(z.number())
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone intersection', () => {
  const schema = z.intersection(z.object({ a: z.string() }), z.object({ b: z.number() }))
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone lazy', () => {
  const schema = z.lazy(() => z.string())
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone literal', () => {
  const schema = z.literal('test')
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone map', () => {
  const schema = z.map(z.string(), z.number())
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone nan', () => {
  const schema = z.nan()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone nativeEnum', () => {
  const schema = z.nativeEnum({ a: 'a', b: 'b', c: 'c' })
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone never', () => {
  const schema = z.never()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone null', () => {
  const schema = z.null()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone nullable', () => {
  const schema = z.string().nullable()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone number', () => {
  const schema = z.number()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone object', () => {
  const schema = z.object({ a: z.string(), b: z.number() })
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone optional', () => {
  const schema = z.string().optional()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone pipeline', () => {
  const schema = z.pipeline(z.string(), z.number())
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone promise', () => {
  const schema = z.promise(z.string())
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone readonly', () => {
  const schema = z.string().readonly()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone record', () => {
  const schema = z.record(z.string())
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone ref', () => {
  const schema = z.ref('test')
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone set', () => {
  const schema = z.set(z.string())
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone string', () => {
  const schema = z.string()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone symbol', () => {
  const schema = z.symbol()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone transformer', () => {
  const schema = z.string().transform((val) => val.toUpperCase())
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone tuple', () => {
  const schema = z.tuple([z.string(), z.number()])
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone undefined', () => {
  const schema = z.undefined()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone union', () => {
  const schema = z.union([z.string(), z.number()])
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone unknown', () => {
  const schema = z.unknown()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
test('clone void', () => {
  const schema = z.void()
  const clone = schema.clone()
  expectZui(clone).toEqual(schema)
  expect(clone).not.toBe(schema)
})
