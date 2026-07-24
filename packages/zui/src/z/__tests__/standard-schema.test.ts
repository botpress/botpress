import { test, expect } from 'vitest'
import * as z from '../index'

test('~standard exposes version and vendor', () => {
  const schema = z.string()
  expect(schema['~standard'].version).toEqual(1)
  expect(schema['~standard'].vendor).toEqual('zui')
})

test('~standard validate always returns a Promise', () => {
  const schema = z.string()
  const result = schema['~standard'].validate('hello')
  expect(result).toBeInstanceOf(Promise)
})

test('~standard validate resolves to { value } on success', async () => {
  const schema = z.object({ name: z.string(), age: z.number().min(0) })
  const result = await schema['~standard'].validate({ name: 'seb', age: 30 })
  expect(result).toEqual({ value: { name: 'seb', age: 30 } })
})

test('~standard validate resolves to { issues } on failure, with path to the failing field', async () => {
  const schema = z.object({ name: z.string(), age: z.number().min(0) })
  const result: any = await schema['~standard'].validate({ name: 'seb', age: -1 })
  expect(result.value).toBeUndefined()
  expect(result.issues).toHaveLength(1)
  expect(result.issues[0].path).toEqual(['age'])
  expect(result.issues[0].message).toBeTypeOf('string')
})

test('~standard validate rejects, and only runs the refinement once, when a sync refinement throws', async () => {
  let calls = 0
  const schema = z.string().refine((data) => {
    calls++
    throw new Error(`boom: ${data}`)
  })

  await expect(schema['~standard'].validate('x')).rejects.toThrow('boom: x')
  expect(calls).toEqual(1)
})

test('~standard validate resolves correctly for schemas with async refinements, invoking the refinement exactly once', async () => {
  let calls = 0
  const schema = z.string().refine(async (val) => {
    calls++
    return val.length > 2
  })

  const failure: any = await schema['~standard'].validate('hi')
  expect(failure.value).toBeUndefined()
  expect(failure.issues).toHaveLength(1)

  calls = 0
  const success = await schema['~standard'].validate('hello')
  expect(success).toEqual({ value: 'hello' })
  expect(calls).toEqual(1)
})

test('~standard validate resolves correctly for schemas with async transforms, invoking the transform exactly once', async () => {
  let calls = 0
  const schema = z.string().transform(async (val) => {
    calls++
    return val.toUpperCase()
  })

  const result = await schema['~standard'].validate('hi')
  expect(result).toEqual({ value: 'HI' })
  expect(calls).toEqual(1)
})
