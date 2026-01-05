import { test, describe, it, expect } from 'vitest'
import * as zui from './z/index'

type ExampleSchema = {
  schema: zui.ZodObject<any>
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
zui.object({
  apples: zui.array(zui.string().title('Apple')),
})
test('Type inference', () => {
  const schema = zui.object({
    name: zui.string().title('Name'),
    age: zui.number().title('Age'),
    employer: zui.object({
      name: zui.string().title('Employer Name'),
    }),
  })

  type Schema = zui.infer<typeof schema>
  const typingsInfer: Schema = {
    employer: {
      name: 'hello',
    },
    age: 10,
    name: 'hello',
  }
  typingsInfer
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

  type Schema = zui.infer<typeof schema>
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

  type Schema = zui.infer<typeof schema>
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
  const func = (type: zui.ZodTypeAny) => {
    return type
  }

  const schema = zui.string().title('Name')
  const result = func(schema)
  result.describe('hello')
})

test('Record 1', () => {
  const schema = zui.record(zui.number().title('Age'))

  type Schema = zui.infer<typeof schema>
  const type: Schema = {
    a: 666,
  }

  schema.parse(type)
})

test('Record 2', () => {
  const schema = zui.record(zui.string().title('Name'), zui.number().title('Age'))

  type Schema = zui.infer<typeof schema>
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
  ] satisfies zui.infer<typeof schema>)
})

describe('custom types', () => {
  const schema = zui.object({
    agent: zui.agent(),
    conversation: zui.conversation(),
    user: zui.user(),
    message: zui.message(),
    event: zui.event(),
    table: zui.table(),
    tablerow: zui.tablerow(),
    intent: zui.intent(),
    aimodel: zui.aimodel().default('gpt-3.5-turbo'),
    datasource: zui.datasource(),
  })

  it('should parse', () => {
    const parse = schema.safeParse({
      agent: 'hello',
      conversation: 'hello',
      user: 'hello',
      message: 'hello',
      event: 'hello',
      table: 'hello',
      tablerow: 'hello',
      intent: 'hello',
      aimodel: 'gpt-3.5-turbo',
      datasource: 'hello',
    })
    expect(parse.success).toBe(true)
  })
})
