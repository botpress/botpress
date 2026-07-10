import { test, expect } from 'vitest'
import * as assert from '../../assertions.utils.test'
import * as z from '../index'

/**
 * Guards for the lazy-output convention on IZodObject.
 *
 * IZodObject extends IZodType<any, ..., any> for tsc performance (see
 * packages/zui-tsc-bench): the real Output/Input types live only in the
 * lazily-resolved `_output`/`_input` members, and every observable member
 * (parse family, refine, transform, default, catch, ...) must derive from
 * `this['_output']`/`this['_input']` — never from the `any` heritage params.
 *
 * If any of these assertions start failing (or an @ts-expect-error goes
 * unused), someone re-introduced a member that leans on the `any` params and
 * silently un-typed the public API for object schemas.
 */

const User = z.object({
  id: z.string(),
  age: z.number().optional(),
})
type UserOut = { id: string; age?: number }

test('parse family returns the precise object type, not any', () => {
  const parsed = User.parse({ id: 'a' })
  assert.assertEqual<typeof parsed, UserOut>(true)

  const safe = User.safeParse({ id: 'a' })
  if (safe.success) {
    assert.assertEqual<typeof safe.data, UserOut>(true)
  }

  expect(parsed.id).toBe('a')
})

test('parseAsync family returns the precise object type, not any', async () => {
  const parsed = await User.parseAsync({ id: 'a' })
  assert.assertEqual<typeof parsed, UserOut>(true)

  const safe = await User.safeParseAsync({ id: 'a' })
  if (safe.success) {
    assert.assertEqual<typeof safe.data, UserOut>(true)
  }

  expect(parsed.id).toBe('a')
})

test('refine / transform / downstream callbacks receive the precise object type', () => {
  User.refine((v) => {
    assert.assertEqual<typeof v, UserOut>(true)
    return true
  })

  User.transform((v) => {
    assert.assertEqual<typeof v, UserOut>(true)
    return v.id
  })

  User.downstream((v) => {
    assert.assertEqual<typeof v, UserOut>(true)
    return { status: 'valid', value: v.id }
  })

  expect(true).toBe(true)
})

test('default() demands the full input shape on object schemas', () => {
  const withDefault = User.default({ id: 'x' })
  expect(withDefault.parse(undefined)).toEqual({ id: 'x' })

  // @ts-expect-error default value must match the object input type
  User.default({ id: 42 })

  // @ts-expect-error missing required key `id`
  User.default({})
})

test('catch() demands the output shape on object schemas', () => {
  const withCatch = User.catch({ id: 'fallback' })
  expect(withCatch.parse(123)).toEqual({ id: 'fallback' })

  // @ts-expect-error catch value must match the object output type
  User.catch({ id: 123 })
})

test('output-constrained APIs still reject wrong-shaped object schemas', () => {
  const acceptsIdString = (_schema: z.ZodSchema<{ id: string }>): void => {}

  acceptsIdString(z.object({ id: z.string() }))

  // @ts-expect-error output type { id: number } must be rejected
  acceptsIdString(z.object({ id: z.number() }))

  // @ts-expect-error non-object schema with wrong output must be rejected
  acceptsIdString(z.string())

  const constrained = <S extends z.ZodType<{ id: string }, any, any>>(s: S): S => s

  constrained(z.object({ id: z.string() }))

  // @ts-expect-error wrong shape must be rejected by the generic constraint
  constrained(z.object({ id: z.boolean() }))

  expect(true).toBe(true)
})

test('discriminatedUnion rejects options missing the discriminator key at compile time', () => {
  const ok = z.discriminatedUnion('type', [
    z.object({ type: z.literal('a'), x: z.string() }),
    z.object({ type: z.literal('b'), y: z.number() }),
  ])
  expect(ok.parse({ type: 'a', x: 'hi' })).toEqual({ type: 'a', x: 'hi' })

  // compile-time: rejected by ZodDiscriminatedUnionOption's weak input type;
  // runtime backstop: construction throws in _getOptionsMap
  expect(() =>
    // @ts-expect-error second option is missing the `type` discriminator key
    z.discriminatedUnion('type', [z.object({ type: z.literal('a') }), z.object({ name: z.string() })])
  ).toThrow('discriminator')
})

test('z.input diverges from z.output through defaults on object fields', () => {
  const WithDefault = z.object({
    id: z.string(),
    role: z.string().default('user'),
  })

  // role is optional on the input side, required on the output side
  assert.assertEqual<z.input<typeof WithDefault>, { id: string; role?: string }>(true)
  assert.assertEqual<z.output<typeof WithDefault>, { id: string; role: string }>(true)

  expect(WithDefault.parse({ id: 'a' })).toEqual({ id: 'a', role: 'user' })
})
