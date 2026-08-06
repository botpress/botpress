import { test, expect } from 'vitest'
import * as z from '../index'

test('~standard exposes version and vendor', () => {
  const schema = z.string()
  expect(schema['~standard'].version).toEqual(1)
  expect(schema['~standard'].vendor).toEqual('zui')
})

test('~standard validate returns synchronously for a schema with no async parts', () => {
  const schema = z.string()
  const result = schema['~standard'].validate('hello')
  expect(result).not.toBeInstanceOf(Promise)
  expect(result).toEqual({ value: 'hello' })
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

test('~standard validate throws synchronously, once, when a sync refinement throws', () => {
  let calls = 0
  const schema = z.string().refine((data) => {
    calls++
    throw new Error(`boom: ${data}`)
  })

  expect(() => schema['~standard'].validate('x')).toThrow('boom: x')
  expect(calls).toEqual(1)
})

test('~standard validate returns a Promise for schemas with async refinements', async () => {
  let calls = 0
  const schema = z.string().refine(async (val) => {
    calls++
    return val.length > 2
  })

  const failurePromise = schema['~standard'].validate('hi')
  expect(failurePromise).toBeInstanceOf(Promise)
  const failure: any = await failurePromise
  expect(failure.value).toBeUndefined()
  expect(failure.issues).toHaveLength(1)
  expect(calls).toEqual(2)

  calls = 0
  const success = await schema['~standard'].validate('hello')
  expect(success).toEqual({ value: 'hello' })
  expect(calls).toEqual(1)
})

test('~standard validate resolves correctly for schemas with async transforms', async () => {
  let calls = 0
  const schema = z.string().transform(async (val) => {
    calls++
    return val.toUpperCase()
  })

  const result = await schema['~standard'].validate('hi')
  expect(result).toEqual({ value: 'HI' })
  expect(calls).toEqual(2)

  calls = 0
  const second = await schema['~standard'].validate('yo')
  expect(second).toEqual({ value: 'YO' })
  expect(calls).toEqual(1)
})

test('~standard validate keeps returning a Promise on subsequent calls once a schema is known to be async', async () => {
  const schema = z.string().refine(async (val) => val.length > 2)

  const first = schema['~standard'].validate('hello')
  expect(first).toBeInstanceOf(Promise)
  await first

  // Now that the schema is known to be async, later calls should go straight to the async path.
  const second = schema['~standard'].validate('world')
  expect(second).toBeInstanceOf(Promise)
  expect(await second).toEqual({ value: 'world' })
})
