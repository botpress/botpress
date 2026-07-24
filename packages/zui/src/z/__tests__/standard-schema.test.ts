import { test, expect } from 'vitest'
import * as z from '../index'

test('~standard exposes version and vendor', () => {
  const schema = z.string()
  expect(schema['~standard'].version).toEqual(1)
  expect(schema['~standard'].vendor).toEqual('zui')
})

test('~standard validate returns { value } on success', () => {
  const schema = z.object({ name: z.string(), age: z.number().min(0) })
  const result = schema['~standard'].validate({ name: 'seb', age: 30 })
  expect(result).toEqual({ value: { name: 'seb', age: 30 } })
})

test('~standard validate returns { issues } on failure, with path to the failing field', () => {
  const schema = z.object({ name: z.string(), age: z.number().min(0) })
  const result: any = schema['~standard'].validate({ name: 'seb', age: -1 })
  expect(result.value).toBeUndefined()
  expect(result.issues).toHaveLength(1)
  expect(result.issues[0].path).toEqual(['age'])
  expect(result.issues[0].message).toBeTypeOf('string')
})

test('~standard validate resolves synchronously for sync schemas', () => {
  const schema = z.string()
  const result = schema['~standard'].validate('hello')
  expect(result).not.toBeInstanceOf(Promise)
  expect(result).toEqual({ value: 'hello' })
})

test('~standard validate rethrows synchronously and only runs the refinement once when a sync refinement throws', () => {
  let calls = 0
  const schema = z.string().refine((data) => {
    calls++
    throw new Error(`boom: ${data}`)
  })

  expect(() => schema['~standard'].validate('x')).toThrow('boom: x')
  expect(calls).toEqual(1)
})

test('~standard validate returns a Promise for schemas with async refinements', async () => {
  const schema = z.string().refine(async (val) => val.length > 2)

  const pending = schema['~standard'].validate('hi')
  expect(pending).toBeInstanceOf(Promise)

  const failure: any = await pending
  expect(failure.value).toBeUndefined()
  expect(failure.issues).toHaveLength(1)

  const success = await schema['~standard'].validate('hello')
  expect(success).toEqual({ value: 'hello' })
})

test('~standard validate returns a Promise for schemas with async transforms', async () => {
  const schema = z.string().transform(async (val) => val.toUpperCase())

  const pending = schema['~standard'].validate('hi')
  expect(pending).toBeInstanceOf(Promise)

  const result = await pending
  expect(result).toEqual({ value: 'HI' })
})
