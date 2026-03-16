import { test, expect } from 'vitest'
import * as assert from '../../assertions.utils.test'
import * as z from '../index'
import { ZodError } from '../error'

test('preprocess', () => {
  const schema = z.preprocess((data) => [data], z.string().array())

  const value = schema.parse('asdf')
  expect(value).toEqual(['asdf'])
  assert.assertEqual<(typeof schema)['_input'], unknown>(true)
})

test('async preprocess', async () => {
  const schema = z.preprocess(async (data) => [data], z.string().array())

  const value = await schema.parseAsync('asdf')
  expect(value).toEqual(['asdf'])
})

test('upstream dirty with parse', () => {
  expect(() => {
    z.upstream(
      (data) =>
        z.DIRTY(data, {
          code: 'custom',
          message: `${data} is not one of our allowed strings`,
        }),
      z.string()
    ).parse('asdf')
  }).toThrow(
    JSON.stringify(
      [
        {
          code: 'custom',
          message: 'asdf is not one of our allowed strings',
          path: [],
        },
      ],
      null,
      2
    )
  )
})

test('upstream dirty non-fatal', () => {
  try {
    z.upstream((data) => {
      return z.DIRTY(data, {
        code: 'custom',
        message: `custom error`,
      })
    }, z.string()).parse(1234)
  } catch (err) {
    ZodError.assert(err)
    expect(err.issues.length).toEqual(2)
  }
})

test('upstream abort is fatal', () => {
  try {
    z.upstream(() => {
      return z.ERR({
        code: 'custom',
        message: `custom error`,
      })
    }, z.string()).parse(1234)
  } catch (err) {
    ZodError.assert(err)
    expect(err.issues.length).toEqual(1)
  }
})

test('async upstream dirty with parse', async () => {
  const schema = z.upstream(async (data) => {
    return z.DIRTY(data, {
      code: 'custom',
      message: `custom error`,
    })
  }, z.string())

  expect(schema.parseAsync('asdf')).rejects.toThrow(
    JSON.stringify(
      [
        {
          code: 'custom',
          message: 'custom error',
          path: [],
        },
      ],
      null,
      2
    )
  )
})

test('upsream dirty with parseAsync', async () => {
  const result = await z
    .upstream(async (data) => {
      return z.DIRTY(data, {
        code: 'custom',
        message: `${data} is not one of our allowed strings`,
      })
    }, z.string())
    .safeParseAsync('asdf')

  expect(JSON.parse(JSON.stringify(result))).toEqual({
    success: false,
    error: {
      __type__: 'ZuiError',
      issues: [
        {
          code: 'custom',
          message: 'asdf is not one of our allowed strings',
          path: [],
        },
      ],
      name: 'ZodError',
    },
  })
})

test('upstream', () => {
  const foo = z.upstream((val) => {
    if (!val) {
      return z.ERR({ code: 'custom', message: 'bad' })
    }
    return z.OK(val)
  }, z.number())

  type foo = z.infer<typeof foo>
  assert.assertEqual<foo, number>(true)
  const arg = foo.safeParse(undefined)
  if (!arg.success) {
    expect(arg.error.issues[0]?.message).toEqual('bad')
  }
})
test('preprocess as the second property of object', () => {
  const schema = z.object({
    nonEmptyStr: z.string().min(1),
    positiveNum: z.preprocess((v) => Number(v), z.number().positive()),
  })
  const result = schema.safeParse({
    nonEmptyStr: '',
    positiveNum: '',
  })
  expect(result.success).toEqual(false)
  if (!result.success) {
    expect(result.error.issues.length).toEqual(2)
    expect(result.error.issues[0]?.code).toEqual('too_small')
    expect(result.error.issues[1]?.code).toEqual('too_small')
  }
})

test('preprocess validates with sibling errors', () => {
  expect(() => {
    z.object({
      // Must be first
      missing: z.string().refine(() => false),
      preprocess: z.preprocess((data) => (data as string)?.trim(), z.string().regex(/ asdf/)),
    }).parse({ preprocess: ' asdf' })
  }).toThrow(
    JSON.stringify(
      [
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['missing'],
          message: 'Required',
        },
        {
          validation: 'regex',
          code: 'invalid_string',
          message: 'Invalid',
          path: ['preprocess'],
        },
      ],
      null,
      2
    )
  )
})
