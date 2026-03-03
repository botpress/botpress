import { test, assert } from 'vitest'
import z from '../index'

test('naked object', () => {
  assert.equal(z.object({ name: z.string() }).naked().typeName, 'ZodObject')
  assert.equal(z.object({ name: z.string() }).nullable().naked().typeName, 'ZodObject')
  assert.equal(
    z
      .object({ name: z.string() })
      .catch(() => ({ name: '' }))
      .naked().typeName,
    'ZodObject'
  )
  assert.equal(z.object({ name: z.string() }).optional().nullable().naked().typeName, 'ZodObject')
  assert.equal(z.object({ name: z.string() }).promise().nullable().naked().typeName, 'ZodObject')
  assert.equal(
    z
      .object({ name: z.string() })
      .catch(() => ({ name: '' }))
      .transform(() => '')
      .promise()
      .optional()
      .nullable()
      .naked().typeName,
    'ZodObject'
  )

  assert.equal(z.object({ name: z.string() }).readonly().naked().typeName, 'ZodObject')
})

test('lazy', () => {
  assert.equal(z.lazy(() => z.string()).naked().typeName, 'ZodString')
  assert.equal(
    z
      .lazy(() => z.string())
      .nullable()
      .naked().typeName,
    'ZodString'
  )
  assert.equal(
    z
      .lazy(() => z.string())
      .optional()
      .nullable()
      .naked().typeName,
    'ZodString'
  )
  assert.equal(
    z
      .lazy(() => z.string())
      .promise()
      .nullable()
      .naked().typeName,
    'ZodString'
  )

  assert.equal(z.lazy(() => z.object({ name: z.string() })).naked().typeName, 'ZodObject')
  assert.equal(
    z
      .lazy(() => z.object({ name: z.string() }))
      .nullable()
      .naked().typeName,
    'ZodObject'
  )
})

test('naked array', () => {
  assert.equal(z.array(z.string()).naked().typeName, 'ZodArray')
  assert.equal(z.array(z.string()).nullable().naked().typeName, 'ZodArray')
  assert.equal(z.array(z.string()).optional().nullable().naked().typeName, 'ZodArray')
  assert.equal(z.array(z.string()).promise().nullable().naked().typeName, 'ZodArray')
})

test('naked string', () => {
  assert.equal(z.string().naked().typeName, 'ZodString')
  assert.equal(z.string().nullable().naked().typeName, 'ZodString')
  assert.equal(z.string().optional().nullable().naked().typeName, 'ZodString')
  assert.equal(z.string().promise().nullable().naked().typeName, 'ZodString')
})

test('naked union', () => {
  assert.equal(z.string().or(z.number()).naked().typeName, 'ZodUnion')
  assert.equal(z.string().or(z.number()).nullable().naked().typeName, 'ZodUnion')
  assert.equal(z.string().or(z.number()).optional().nullable().naked().typeName, 'ZodUnion')
  assert.equal(z.string().or(z.number()).promise().nullable().naked().typeName, 'ZodUnion')
})

test('get constructor names', () => {
  assert.equal(
    z
      .string()
      .catch(() => '')
      .naked().typeName,
    'ZodString'
  )

  assert.equal(
    z
      .string()
      .catch(() => '')
      .nullable()
      .naked().typeName,
    'ZodString'
  )
})

test('not naked constructors', () => {
  assert.equal(z.string().catch(() => '').typeName, 'ZodCatch')

  assert.equal(
    z
      .string()
      .catch(() => '')
      .nullable().typeName,
    'ZodNullable'
  )
})
