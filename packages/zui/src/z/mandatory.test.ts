import { describe, test, expect } from 'vitest'
import { z } from './index'

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

describe('mandatory', () => {
  test('undefined', () => {
    const schema = z.undefined()
    const requiredSchema = schema.mandatory()
    expect(schema.isOptional()).toBe(true)
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.never())
  })
  test('optional string', () => {
    const schema = z.string().optional()
    const requiredSchema = schema.mandatory()
    expect(schema.isOptional()).toBe(true)
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.string())
  })
  test('string or undefined', () => {
    const schema = z.string().or(z.undefined())
    const requiredSchema = schema.mandatory()
    expect(schema.isOptional()).toBe(true)
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.string())
  })
  test('string or number or undefined', () => {
    const schema = z.union([z.string(), z.number(), z.undefined()])
    const requiredSchema = schema.mandatory()
    expect(schema.isOptional()).toBe(true)
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.union([z.string(), z.number()]))
  })
  test('empty union', () => {
    const options: any[] = []
    const schema = z.union(options as [any, any]) // should not be allowed
    const requiredSchema = schema.mandatory()
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.never())
  })
  test('branded optional string', () => {
    const schema = z.string().optional().brand('test')
    const requiredSchema = schema.mandatory()
    expect(schema.isOptional()).toBe(true)
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.string().brand('test'))
  })
  test('catch optional string', () => {
    const schema = z.string().optional().catch('test')
    const requiredSchema = schema.mandatory()
    expect(schema.isOptional()).toBe(true)
    // catch schema is still considered optional
    expectZui(requiredSchema).toEqual(z.string().catch('test'))
  })
  test('default optional string', () => {
    const schema = z.string().optional().default('test')
    const requiredSchema = schema.mandatory()
    expect(schema.isOptional()).toBe(true)
    // default schema is still considered optional
    expectZui(requiredSchema).toEqual(z.string().default('test'))
  })
  test('lazy optional string', () => {
    const schema = z.lazy(() => z.string().optional())
    const requiredSchema = schema.mandatory()
    expect(schema.isOptional()).toBe(true)
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.lazy(() => z.string()))
  })
  test('nullable optional string', () => {
    const schema = z.string().optional().nullable()
    const requiredSchema = schema.mandatory()
    expect(schema.isOptional()).toBe(true)
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.string().nullable())
  })
  test('readonly optional string', () => {
    const schema = z.string().optional().readonly()
    const requiredSchema = schema.mandatory()
    expect(schema.isOptional()).toBe(true)
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.string().readonly())
  })
  test('transform optional string', () => {
    const fn = (val: string | undefined) => val
    const schema = z.string().optional().transform(fn)
    const requiredSchema = schema.mandatory()
    expect(schema.isOptional()).toBe(true)
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.string().transform(fn))
  })
})
