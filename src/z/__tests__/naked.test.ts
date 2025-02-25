import { assert } from 'vitest'

import z, { ZodArray, ZodObject, ZodString, ZodUnion } from '../index'

test('naked object', () => {
  assert.instanceOf(z.object({ name: z.string() }).naked(), ZodObject)
  assert.instanceOf(z.object({ name: z.string() }).nullable().naked(), ZodObject)
  assert.instanceOf(
    z
      .object({ name: z.string() })
      .catch(() => ({ name: '' }))
      .naked(),
    ZodObject,
  )
  assert.instanceOf(z.object({ name: z.string() }).optional().nullable().naked(), ZodObject)
  assert.instanceOf(z.object({ name: z.string() }).promise().nullable().naked(), ZodObject)
  assert.instanceOf(
    z
      .object({ name: z.string() })
      .catch(() => ({ name: '' }))
      .transform(() => '')
      .promise()
      .optional()
      .nullable()
      .naked(),
    ZodObject,
  )

  assert.instanceOf(z.object({ name: z.string() }).readonly().naked(), ZodObject)
})

test('lazy', () => {
  assert.instanceOf(z.lazy(() => z.string()).naked(), ZodString)
  assert.instanceOf(
    z
      .lazy(() => z.string())
      .nullable()
      .naked(),
    ZodString,
  )
  assert.instanceOf(
    z
      .lazy(() => z.string())
      .optional()
      .nullable()
      .naked(),
    ZodString,
  )
  assert.instanceOf(
    z
      .lazy(() => z.string())
      .promise()
      .nullable()
      .naked(),
    ZodString,
  )

  assert.instanceOf(z.lazy(() => z.object({ name: z.string() })).naked(), ZodObject)
  assert.instanceOf(
    z
      .lazy(() => z.object({ name: z.string() }))
      .nullable()
      .naked(),
    ZodObject,
  )
})

test('naked array', () => {
  assert.instanceOf(z.array(z.string()).naked(), ZodArray)
  assert.instanceOf(z.array(z.string()).nullable().naked(), ZodArray)
  assert.instanceOf(z.array(z.string()).optional().nullable().naked(), ZodArray)
  assert.instanceOf(z.array(z.string()).promise().nullable().naked(), ZodArray)
})

test('naked string', () => {
  assert.instanceOf(z.string().naked(), ZodString)
  assert.instanceOf(z.string().nullable().naked(), ZodString)
  assert.instanceOf(z.string().optional().nullable().naked(), ZodString)
  assert.instanceOf(z.string().promise().nullable().naked(), ZodString)
})

test('naked union', () => {
  assert.instanceOf(z.string().or(z.number()).naked(), ZodUnion)
  assert.instanceOf(z.string().or(z.number()).nullable().naked(), ZodUnion)
  assert.instanceOf(z.string().or(z.number()).optional().nullable().naked(), ZodUnion)
  assert.instanceOf(z.string().or(z.number()).promise().nullable().naked(), ZodUnion)
})

test('get constructor names', () => {
  assert.equal(
    z
      .string()
      .catch(() => '')
      .naked().constructor.name,
    'ZodString',
  )

  assert.equal(
    z
      .string()
      .catch(() => '')
      .nullable()
      .naked().constructor.name,
    'ZodString',
  )
})

test('not naked constructors', () => {
  assert.equal(z.string().catch(() => '').constructor.name, 'ZodCatch')

  assert.equal(
    z
      .string()
      .catch(() => '')
      .nullable().constructor.name,
    'ZodNullable',
  )
})
