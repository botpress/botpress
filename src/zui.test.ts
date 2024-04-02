import { describe, test, expect } from 'vitest'
import { zui } from '.'
import * as ogZod from 'zod'
import { Infer, ZuiTypeAny } from './zui'

type ExampleSchema = {
  schema: ogZod.ZodObject<any>
}
// check that a zui schema is compatible with a zod schema
export const someSchema: ExampleSchema = {
  schema: zui.object({
    name: zui.string().title('Name'),
    age: zui.number().title('Age'),
    employer: zui
      .object({
        name: zui.string().title('Employer Name'),
      })
      .disabled(),
  }),
}

describe('zui', () => {
  test('vanially zui gives me a zui def', () => {
    expect(zui.string().ui).toEqual({})
  })

  test('string', () => {
    const schema = zui.string().regex(/hello/i).title('Title').disabled().length(20)

    expect(schema.ui).toEqual({
      title: 'Title',
      disabled: true,
    })
  })

  test('number', () => {
    const schema = zui.number().min(10).title('Title').disabled(true).max(20).int()

    expect(schema.ui).toEqual({
      title: 'Title',
      disabled: true,
    })
  })

  test('boolean', () => {
    const schema = zui.boolean().title('Title').disabled()

    expect(schema.ui).toEqual({
      title: 'Title',
      disabled: true,
    })
  })

  test('optional', () => {
    const a = zui.boolean().title('Active').optional()
    const b = zui.boolean().title('Active')

    expect(a.ui).toEqual(b.ui)
  })

  test('with default value', () => {
    const a = zui.boolean().title('Active').default(true)
    const b = zui.boolean().title('Active')

    expect(a.ui).toEqual(b.ui)
  })
})

test('Type inference', () => {
  const schema = zui.object({
    name: zui.string().title('Name'),
    age: zui.number().title('Age'),
    employer: zui.object({
      name: zui.string().title('Employer Name'),
    }),
  })

  type Schema = Infer<typeof schema>
  const typingsInfer: Schema = {
    employer: {
      name: 'hello',
    },
    age: 10,
    name: 'hello',
  }
  console.info(typingsInfer)
})

test('Unions', () => {
  const schema = zui.union([
    zui.object({
      type: zui.literal('a'),
      a: zui.string(),
    }),
    zui.object({
      type: zui.literal('b'),
      b: zui.number(),
    }),
  ])

  type Schema = Infer<typeof schema>
  const type_a: Schema = {
    type: 'a',
    a: 'hello',
  }

  const type_b: Schema = {
    type: 'b',
    b: 5,
  }

  schema.parse(type_a)
  schema.parse(type_b)
})

test('Discriminated Unions', () => {
  const schema = zui.discriminatedUnion('type', [
    zui.object({
      type: zui.literal('a'),
      a: zui.string(),
    }),
    zui.object({
      type: zui.literal('b'),
      b: zui.number(),
    }),
  ])

  type Schema = Infer<typeof schema>
  const type_a: Schema = {
    type: 'a',
    a: 'hello',
  }

  const type_b: Schema = {
    type: 'b',
    b: 5,
  }

  schema.parse(type_a)
  schema.parse(type_b)
})

test('ZuiTypeAny', () => {
  const func = (type: ZuiTypeAny) => {
    return type
  }

  const schema = zui.string().title('Name')
  const result = func(schema)
  result.tooltip('hello')
})

test('Record 1', () => {
  const schema = zui.record(zui.number().title('Age'))

  type Schema = Infer<typeof schema>
  const type: Schema = {
    a: 666,
  }

  schema.parse(type)
})

test('Record 2', () => {
  const schema = zui.record(zui.string().title('Name'), zui.number().title('Age'))

  type Schema = Infer<typeof schema>
  const type: Schema = {
    a: 666,
  }

  schema.parse(type)
})

test('any', () => {
  const schema = zui.any()
  schema.parse({ a: 666 })
})

test('unknown', () => {
  const schema = zui.unknown()
  schema.parse({ a: 666 })
})

test('null', () => {
  const schema = zui.null()
  schema.parse(null)
})

test('Lazy', () => {
  const schema = zui.lazy(() =>
    zui.object({
      type: zui.string(),
      value: zui.number().hidden(true),
    }),
  )

  schema.parse({ type: 'hello', value: 5 })
})

test('array', () => {
  const schema = zui.array(
    zui.object({
      name: zui.string(),
      age: zui.number(),
      aliases: zui.record(zui.string(), zui.object({ name: zui.string() }), {}),
    }),
  )

  schema.parse([
    {
      age: 34,
      name: 'Hello',
      aliases: {
        yo: { name: 'jacques' },
      },
    },
  ] satisfies Infer<typeof schema>)
})
