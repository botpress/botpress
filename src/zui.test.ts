import { describe, test, expect } from 'vitest'
import { zui } from '.'
import { Infer, ZuiTypeAny } from './zui'

describe('zui', () => {
  test('vanially zui gives me a zui def', () => {
    expect(zui.string().ui).toEqual({})
  })

  test('string', () => {
    const schema = zui.string().regex(/hello/i).title('Title').examples(['Example 1']).readonly(true).length(20)

    expect(schema.ui).toEqual({
      title: 'Title',
      examples: ['Example 1'],
      readonly: true,
    })
  })

  test('number', () => {
    const schema = zui.number().min(10).title('Title').examples([10]).readonly(true).max(20).int()

    expect(schema.ui).toEqual({
      title: 'Title',
      examples: [10],
      readonly: true,
    })
  })

  test('boolean', () => {
    const schema = zui.boolean().title('Title').examples([true]).readonly(true)

    expect(schema.ui).toEqual({
      title: 'Title',
      examples: [true],
      readonly: true,
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
  result.tooltip(true)
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
