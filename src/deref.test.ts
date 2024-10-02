import { describe, test } from 'vitest'
import { z } from './z/index'

const foo = z.ref('foo')
const bar = z.ref('bar')
const baz = z.ref('baz')

const deref = {
  foo: z.string(),
  bar: z.number(),
  baz: z.boolean(),
}

const intersect = (...schemas: z.ZodTypeAny[]) => {
  if (schemas.length === 0) {
    throw new Error('Intersection expects at least one schema')
  }

  let current = schemas[0]!
  for (let i = 1; i < schemas.length; i++) {
    current = z.intersection(current, schemas[i]!)
  }

  return current
}

describe('dereference', () => {
  test('array', () => {
    const refSchema = z.array(bar)
    const derefSchema = refSchema.dereference(deref)
    const result = derefSchema.safeParse([1, 2, 3])
    expect(result.success).toBe(true)
  })
  test('discriminatedUnion', () => {
    const refSchema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('foo'), foo: foo }),
      z.object({ type: z.literal('bar'), bar: bar }),
      z.object({ type: z.literal('baz'), baz: baz }),
    ])
    const derefSchema = refSchema.dereference(deref)
    const result = derefSchema.safeParse({ type: 'foo', foo: 'astring' })
    expect(result.success).toBe(true)
  })
  test('function', () => {
    const refSchema = z.function(z.tuple([foo, bar]), baz)
    const derefSchema = refSchema.dereference(deref)
    const result = derefSchema.safeParse((_a: string, _b: number) => true)
    expect(result.success).toBe(true)
  })
  test('intersection', () => {
    const refSchema = intersect(z.object({ foo }), z.object({ bar }), z.object({ baz }))
    const derefSchema = refSchema.dereference(deref)
    const result = derefSchema.safeParse({ foo: 'astring', bar: 1, baz: true })
    expect(result.success).toBe(true)
  })
  test('map', () => {
    const refSchema = z.map(foo, bar)
    const derefSchema = refSchema.dereference(deref)
    const result = derefSchema.safeParse(new Map([['astring', 1]]))
    expect(result.success).toBe(true)
  })
  test('nullable', () => {
    const refSchema = z.nullable(foo)
    const derefSchema = refSchema.dereference(deref)
    const result = derefSchema.safeParse(null)
    expect(result.success).toBe(true)
  })
  test('object', () => {
    const refSchema = z.object({
      foo,
      bar,
      baz,
    })
    const derefSchema = refSchema.dereference(deref)
    const result = derefSchema.safeParse({ foo: 'astring', bar: 1, baz: true })
    expect(result.success).toBe(true)
  })
  test('optional', () => {
    const refSchema = z.optional(foo)
    const derefSchema = refSchema.dereference(deref)
    const result = derefSchema.safeParse(undefined)
    expect(result.success).toBe(true)
  })
  test('promise', () => {
    const refSchema = z.promise(foo)
    const derefSchema = refSchema.dereference(deref)
    const result = derefSchema.safeParse(Promise.resolve('astring'))
    expect(result.success).toBe(true)
  })
  test('record', () => {
    const refSchema = z.record(foo, bar)
    const derefSchema = refSchema.dereference(deref)
    const result = derefSchema.safeParse({ foo: 1 })
    expect(result.success).toBe(true)
  })
  test('set', () => {
    const refSchema = z.set(foo)
    const derefSchema = refSchema.dereference(deref)
    const result = derefSchema.safeParse(new Set(['astring']))
    expect(result.success).toBe(true)
  })
  test('transformer', () => {
    const refSchema = z.transformer(foo, {
      type: 'transform',
      transform: (data) => data,
    })
    const derefSchema = refSchema.dereference(deref)
    const result = derefSchema.safeParse('astring')
    expect(result.success).toBe(true)
  })
  test('tuple', () => {
    const refSchema = z.tuple([foo, bar])
    const derefSchema = refSchema.dereference(deref)
    const result = derefSchema.safeParse(['astring', 1])
    expect(result.success).toBe(true)
  })
  test('union', () => {
    const refSchema = z.union([foo, bar, baz])
    const derefSchema = refSchema.dereference(deref)
    const result = derefSchema.safeParse('astring')
    expect(result.success).toBe(true)
  })
  test('default', () => {
    const refSchema = z.array(foo).default([])
    const derefSchema = refSchema.dereference(deref)

    expect(derefSchema.safeParse(['astring']).success).toBe(true)
    expect(derefSchema.safeParse([111111111]).success).toBe(false)
    expect(derefSchema.safeParse(undefined).success).toBe(true)
  })
  test('should treat multiple references with the same uri as the same reference', () => {
    const refSchema = z.object({
      foo,
      bar: z.ref('foo'),
      baz: z.ref('foo'),
    })
    const derefSchema = refSchema.dereference(deref)
    const result = derefSchema.safeParse({ foo: 'astring', bar: 'astring', baz: 'astring' })
    expect(result.success).toBe(true)
  })
})

describe('getReferences', () => {
  test('array', () => {
    const refSchema = z.array(bar)
    const refs = refSchema.getReferences()
    expect(refs).toEqual(['bar'])
  })
  test('discriminatedUnion', () => {
    const refSchema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('foo'), foo: foo }),
      z.object({ type: z.literal('bar'), bar: bar }),
      z.object({ type: z.literal('baz'), baz: baz }),
    ])
    const refs = refSchema.getReferences()
    expect(refs).toEqual(['foo', 'bar', 'baz'])
  })
  test('function', () => {
    const refSchema = z.function(z.tuple([foo, bar]), baz)
    const refs = refSchema.getReferences()
    expect(refs).toEqual(['foo', 'bar', 'baz'])
  })
  test('intersection', () => {
    const refSchema = intersect(z.object({ foo }), z.object({ bar }), z.object({ baz }))
    const refs = refSchema.getReferences()
    expect(refs).toEqual(['foo', 'bar', 'baz'])
  })
  test('map', () => {
    const refSchema = z.map(foo, bar)
    const refs = refSchema.getReferences()
    expect(refs).toEqual(['foo', 'bar'])
  })
  test('nullable', () => {
    const refSchema = z.nullable(foo)
    const refs = refSchema.getReferences()
    expect(refs).toEqual(['foo'])
  })
  test('object', () => {
    const refSchema = z.object({
      foo,
      bar,
      baz,
    })
    const refs = refSchema.getReferences()
    expect(refs).toEqual(['foo', 'bar', 'baz'])
  })
  test('optional', () => {
    const refSchema = z.optional(foo)
    const refs = refSchema.getReferences()
    expect(refs).toEqual(['foo'])
  })
  test('promise', () => {
    const refSchema = z.promise(foo)
    const refs = refSchema.getReferences()
    expect(refs).toEqual(['foo'])
  })
  test('record', () => {
    const refSchema = z.record(foo, bar)
    const refs = refSchema.getReferences()
    expect(refs).toEqual(['foo', 'bar'])
  })
  test('set', () => {
    const refSchema = z.set(foo)
    const refs = refSchema.getReferences()
    expect(refs).toEqual(['foo'])
  })
  test('transformer', () => {
    const refSchema = z.transformer(foo, {
      type: 'transform',
      transform: (data) => data,
    })
    const refs = refSchema.getReferences()
    expect(refs).toEqual(['foo'])
  })
  test('tuple', () => {
    const refSchema = z.tuple([foo, bar])
    const refs = refSchema.getReferences()
    expect(refs).toEqual(['foo', 'bar'])
  })
  test('union', () => {
    const refSchema = z.union([foo, bar, baz])
    const refs = refSchema.getReferences()
    expect(refs).toEqual(['foo', 'bar', 'baz'])
  })
  test('should treat multiple references with the same uri as the same reference', () => {
    const refSchema = z.object({
      foo,
      bar: z.ref('foo'),
      baz: z.ref('foo'),
    })
    const refs = refSchema.getReferences()
    expect(refs).toEqual(['foo'])
  })
})
