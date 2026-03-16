import { test, expect } from 'vitest'
import * as assert from '../../assertions.utils.test'
import * as z from '../index'

const _strictEqual = (a: unknown, b: unknown) => a === b

test('refinement', () => {
  const obj1 = z.object({
    first: z.string(),
    second: z.string(),
  })
  const obj2 = obj1.partial().strict()

  const obj3 = obj2.refine((data) => data.first || data.second, 'Either first or second should be filled in.')

  expect(_strictEqual(obj1, obj2)).toEqual(false)
  expect(_strictEqual(obj2, obj3)).toEqual(false)

  expect(() => obj1.parse({})).toThrow()
  expect(() => obj2.parse({ third: 'adsf' })).toThrow()
  expect(() => obj3.parse({})).toThrow()
  obj3.parse({ first: 'a' })
  obj3.parse({ second: 'a' })
  obj3.parse({ first: 'a', second: 'a' })
})

test('refinement 2', () => {
  const validationSchema = z
    .object({
      email: z.string().email(),
      password: z.string(),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, 'Both password and confirmation must match')

  expect(() =>
    validationSchema.parse({
      email: 'aaaa@gmail.com',
      password: 'aaaaaaaa',
      confirmPassword: 'bbbbbbbb',
    })
  ).toThrow()
})

test('refinement type guard', () => {
  const validationSchema = z.object({
    a: z.string().refine((s): s is 'a' => s === 'a'),
  })
  type Input = z.input<typeof validationSchema>
  type Schema = z.infer<typeof validationSchema>

  assert.assertEqual<'a', Input['a']>(false)
  assert.assertEqual<string, Input['a']>(true)

  assert.assertEqual<'a', Schema['a']>(true)
  assert.assertEqual<string, Schema['a']>(false)
})

test('refinement Promise', async () => {
  const validationSchema = z
    .object({
      email: z.string().email(),
      password: z.string(),
      confirmPassword: z.string(),
    })
    .refine(
      (data) => Promise.resolve().then(() => data.password === data.confirmPassword),
      'Both password and confirmation must match'
    )

  await validationSchema.parseAsync({
    email: 'aaaa@gmail.com',
    password: 'password',
    confirmPassword: 'password',
  })
})

test('custom path', async () => {
  const result = await z
    .object({
      password: z.string(),
      confirm: z.string(),
    })
    .refine((data) => data.confirm === data.password, { path: ['confirm'] })
    .spa({ password: 'asdf', confirm: 'qewr' })
  expect(result.success).toEqual(false)
  if (!result.success) {
    expect(result.error.issues[0]?.path).toEqual(['confirm'])
  }
})

test('downstream', () => {
  const Strings = z.array(z.string()).downstream((val) => {
    const issues: z.EffectIssue[] = []
    if (val.length > 3) {
      issues.push({
        code: 'too_big',
        maximum: 3,
        type: 'array',
        inclusive: true,
        exact: true,
        message: 'Too many items 😡',
      })
    }

    if (val.length !== new Set(val).size) {
      issues.push({
        code: 'custom',
        message: `No duplicates allowed.`,
      })
    }

    if (issues.length) {
      return z.ERR(...issues)
    }
  })

  const result = Strings.safeParse(['asfd', 'asfd', 'asfd', 'asfd'])

  expect(result.success).toEqual(false)
  if (!result.success) expect(result.error.issues.length).toEqual(2)

  Strings.parse(['asfd', 'qwer'])
})

test('downstream async', async () => {
  const Strings = z.array(z.string()).downstream(async (val) => {
    const issues: z.EffectIssue[] = []
    if (val.length > 3) {
      issues.push({
        code: 'too_big',
        maximum: 3,
        type: 'array',
        inclusive: true,
        exact: true,
        message: 'Too many items 😡',
      })
    }

    if (val.length !== new Set(val).size) {
      issues.push({
        code: 'custom',
        message: `No duplicates allowed.`,
      })
    }

    if (issues.length) {
      return z.ERR(...issues)
    }
  })

  const result = await Strings.safeParseAsync(['asfd', 'asfd', 'asfd', 'asfd'])

  expect(result.success).toEqual(false)
  if (!result.success) expect(result.error.issues.length).toEqual(2)

  Strings.parseAsync(['asfd', 'qwer'])
})

test('downstream - type narrowing', () => {
  type NarrowType = { type: string; age: number }
  const schema = z
    .object({
      type: z.string(),
      age: z.number(),
    })
    .nullable()
    .downstream((arg): z.EffectReturnType<NarrowType> => {
      if (!arg) {
        // still need to make a call to ctx.addIssue
        return z.ERR({
          code: 'custom',
          message: 'cannot be null',
          fatal: true,
        })
      }
      return z.OK(arg)
    })

  assert.assertEqual<z.infer<typeof schema>, NarrowType>(true)

  expect(schema.safeParse({ type: 'test', age: 0 }).success).toEqual(true)
  expect(schema.safeParse(null).success).toEqual(false)
})

test('chained mixed refining types', () => {
  type firstRefinement = { first: string; second: number; third: true }
  type secondRefinement = { first: 'bob'; second: number; third: true }
  type thirdRefinement = { first: 'bob'; second: 33; third: true }
  const schema = z
    .object({
      first: z.string(),
      second: z.number(),
      third: z.boolean(),
    })
    .nullable()
    .refine((arg): arg is firstRefinement => !!arg?.third)
    .downstream((arg): z.EffectReturnType<secondRefinement> => {
      assert.assertEqual<typeof arg, firstRefinement>(true)
      if (arg.first !== 'bob') {
        return z.ERR({
          code: 'custom',
          message: '`first` property must be `bob`',
        })
      }
      return z.OK(arg as secondRefinement)
    })
    .refine((arg): arg is thirdRefinement => {
      assert.assertEqual<typeof arg, secondRefinement>(true)
      return arg.second === 33
    })

  assert.assertEqual<z.infer<typeof schema>, thirdRefinement>(true)
})

test('get inner type', () => {
  z.string()
    .refine(() => true)
    .innerType()
    .parse('asdf')
})

test('chained refinements', () => {
  const objectSchema = z
    .object({
      length: z.number(),
      size: z.number(),
    })
    .refine(({ length }) => length > 5, {
      path: ['length'],
      message: 'length greater than 5',
    })
    .refine(({ size }) => size > 7, {
      path: ['size'],
      message: 'size greater than 7',
    })
  const r1 = objectSchema.safeParse({
    length: 4,
    size: 9,
  })
  expect(r1.success).toEqual(false)
  if (!r1.success) expect(r1.error.issues.length).toEqual(1)

  const r2 = objectSchema.safeParse({
    length: 4,
    size: 3,
  })
  expect(r2.success).toEqual(false)
  if (!r2.success) expect(r2.error.issues.length).toEqual(2)
})

test('fatal downstream', () => {
  const Strings = z
    .string()
    .downstream((val) => {
      if (val === '') {
        return z.ERR({
          code: 'custom',
          message: 'foo',
          fatal: true,
        })
      }
    })
    .downstream((val) => {
      if (val !== ' ') {
        return z.ERR({
          code: 'custom',
          message: 'bar',
        })
      }
    })

  const result = Strings.safeParse('')

  expect(result.success).toEqual(false)
  if (!result.success) expect(result.error.issues.length).toEqual(1)
})
