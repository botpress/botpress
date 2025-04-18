import z from '../../z'
import { describe, test, expect } from 'vitest'
import { fromJsonSchema } from './index'
import { JSONSchema7 } from 'json-schema'
import { ZuiJsonSchema } from '../common/json-schema'

const buildSchema = (s: JSONSchema7, xZui: ZuiJsonSchema['x-zui'] = undefined): JSONSchema7 => {
  return { ...s, 'x-zui': xZui } as JSONSchema7
}

const undefinedSchema = (xZui?: ZuiJsonSchema['x-zui']): JSONSchema7 =>
  buildSchema({ not: true }, { ...xZui, def: { typeName: z.ZodFirstPartyTypeKind.ZodUndefined } })

const nullSchema = (xZui?: ZuiJsonSchema['x-zui']): JSONSchema7 => buildSchema({ type: 'null' }, xZui)

const assert = (actual: z.Schema) => ({
  toEqual: (expected: z.Schema) => {
    const result = actual.isEqual(expected)
    let msg: string | undefined = undefined
    try {
      msg = `Expected ${actual.toTypescriptSchema()} to equal ${expected.toTypescriptSchema()}`
    } catch {}
    expect(result, msg).toBe(true)
  },
})

describe.concurrent('zuifromJsonSchemaNext', () => {
  test('should map StringSchema to ZodString', () => {
    const jSchema = buildSchema({ type: 'string' })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.string()
    assert(zSchema).toEqual(expected)
  })

  test('should map NumberSchema to ZodNumber', () => {
    const jSchema = buildSchema({ type: 'number' })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.number()
    assert(zSchema).toEqual(expected)
  })

  test('should map BooleanSchema to ZodBoolean', () => {
    const jSchema = buildSchema({ type: 'boolean' })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.boolean()
    assert(zSchema).toEqual(expected)
  })

  test('should map UndefinedSchema to ZodUndefined', () => {
    const jSchema = buildSchema({ not: true }, { def: { typeName: 'ZodUndefined' } })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.undefined()
    assert(zSchema).toEqual(expected)
  })

  test('should map NullSchema to ZodNull', () => {
    const jSchema = buildSchema({ type: 'null' }, { def: { typeName: 'ZodNull' } })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.null()
    assert(zSchema).toEqual(expected)
  })

  test('should map AnySchema to ZodAny', () => {
    const jSchema = buildSchema({})
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.any()
    assert(zSchema).toEqual(expected)
  })

  test('should map UnknownSchema to ZodUnknown', () => {
    const jSchema = buildSchema({}, { def: { typeName: 'ZodUnknown' } })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.unknown()
    assert(zSchema).toEqual(expected)
  })

  test('should map NeverSchema to ZodNever', () => {
    const jSchema = buildSchema({ not: true })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.never()
    assert(zSchema).toEqual(expected)
  })

  describe.concurrent('ArraySchema', () => {
    test('should map ArraySchema to ZodArray', () => {
      const jSchema = buildSchema({ type: 'array', items: { type: 'string' } })
      const zSchema = fromJsonSchema(jSchema)
      const expected = z.array(z.string())
      assert(zSchema).toEqual(expected)
    })

    test('should map ArraySchema with min to ZodArray', () => {
      const jSchema = buildSchema({ type: 'array', items: { type: 'string' }, minItems: 4 })
      const zSchema = fromJsonSchema(jSchema)
      const expected = z.array(z.string()).min(4)
      assert(zSchema).toEqual(expected)
    })

    test('should map ArraySchema with min and max to ZodArray', () => {
      const jSchema = buildSchema({ type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 8 })
      const zSchema = fromJsonSchema(jSchema)
      const expected = z.array(z.string()).min(4).max(8)
      assert(zSchema).toEqual(expected)
    })

    test('should map ArraySchema with exact size to ZodArray', () => {
      const jSchema = buildSchema({ type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 })
      const zSchema = fromJsonSchema(jSchema)
      const expected = z.array(z.string()).length(4)
      assert(zSchema).toEqual(expected)
    })
  })

  test('should map ObjectSchema to ZodObject', () => {
    const jSchema = buildSchema({ type: 'object', properties: { name: { type: 'string' } }, required: ['name'] })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.object({ name: z.string() })
    assert(zSchema).toEqual(expected)
  })

  test('should map ObjectSchema with optional fields to ZodObject', () => {
    const jSchema = buildSchema({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
        data: {
          anyOf: [{ type: 'string' }, { type: 'null' }],
        },
      },
      required: ['name'],
    })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.object({
      name: z.string(),
      age: z.number().optional(),
      data: z.union([z.string(), z.null()]).optional(),
    })
    assert(zSchema).toEqual(expected)
  })

  test('should map ObjectSchema with additional properties NumberSchema to ZodObject', () => {
    const jSchema = buildSchema({
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
      additionalProperties: { type: 'number' },
    })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.object({ name: z.string() }).catchall(z.number())
    assert(zSchema).toEqual(expected)
  })

  test('should map ObjectSchema with additional properties AnySchema to ZodObject', () => {
    const jSchema = buildSchema({
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
      additionalProperties: true,
    })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.object({ name: z.string() }).passthrough()
    assert(zSchema).toEqual(expected)
  })

  test('should map ObjectSchema with additional properties NeverSchema to ZodObject', () => {
    const jSchema = buildSchema({
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
      additionalProperties: false,
    })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.object({ name: z.string() }).strict()
    assert(zSchema).toEqual(expected)
  })

  test('should map UnionSchema to ZodUnion', () => {
    const jSchema = buildSchema({ anyOf: [{ type: 'string' }, { type: 'number' }] })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.union([z.string(), z.number()])
    assert(zSchema).toEqual(expected)
  })

  test('should map DiscriminatedUnionSchema to ZodUnion', () => {
    const jSchema = buildSchema({
      anyOf: [
        {
          type: 'object',
          properties: { type: { type: 'string', const: 'A' }, a: { type: 'string' } },
          required: ['type', 'a'],
        },
        {
          type: 'object',
          properties: { type: { type: 'string', const: 'B' }, b: { type: 'number' } },
          required: ['type', 'b'],
        },
      ],
    })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.union([
      z.object({ type: z.literal('A'), a: z.string() }),
      z.object({ type: z.literal('B'), b: z.number() }),
    ])
    assert(zSchema).toEqual(expected)
  })

  test('should map IntersectionSchema to ZodIntersection', () => {
    const jSchema = buildSchema({
      allOf: [
        { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
        { type: 'object', properties: { b: { type: 'number' } }, required: ['b'] },
      ],
    })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.intersection(z.object({ a: z.string() }), z.object({ b: z.number() }))
    assert(zSchema).toEqual(expected)
  })

  test('should map TupleSchema to ZodTuple', () => {
    const jSchema = buildSchema({ type: 'array', items: [{ type: 'string' }, { type: 'number' }] })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.tuple([z.string(), z.number()])
    assert(zSchema).toEqual(expected)
  })

  test('should map RecordSchema to ZodRecord', () => {
    const jSchema = buildSchema({ type: 'object', additionalProperties: { type: 'number' } })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.record(z.number())
    assert(zSchema).toEqual(expected)
  })

  describe.concurrent('SetSchema', () => {
    test('should map SetSchema to ZodSet', () => {
      const jSchema = buildSchema({ type: 'array', items: { type: 'string' }, uniqueItems: true })
      const zSchema = fromJsonSchema(jSchema)
      const expected = z.set(z.string())
      assert(zSchema).toEqual(expected)
    })

    test('should map SetSchema with min to ZodSet', () => {
      const jSchema = buildSchema({ type: 'array', items: { type: 'string' }, uniqueItems: true, minItems: 4 })
      const zSchema = fromJsonSchema(jSchema)
      const expected = z.set(z.string()).min(4)
      assert(zSchema).toEqual(expected)
    })

    test('should map SetSchema with min and max to ZodSet', () => {
      const jSchema = buildSchema({
        type: 'array',
        items: { type: 'string' },
        uniqueItems: true,
        minItems: 4,
        maxItems: 8,
      })
      const zSchema = fromJsonSchema(jSchema)
      const expected = z.set(z.string()).min(4).max(8)
      assert(zSchema).toEqual(expected)
    })
  })

  test('should map LiteralStringSchema to ZodLiteral', () => {
    const jSchema = buildSchema({ type: 'string', const: 'a' })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.literal('a')
    assert(zSchema).toEqual(expected)
  })

  test('should map LiteralNumberSchema to ZodLiteral', () => {
    const jSchema = buildSchema({ type: 'number', const: 1 })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.literal(1)
    assert(zSchema).toEqual(expected)
  })

  test('should map LiteralBooleanSchema to ZodLiteral', () => {
    const jSchema = buildSchema({ type: 'boolean', const: true })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.literal(true)
    assert(zSchema).toEqual(expected)
  })

  test('should map EnumSchema to ZodEnum', () => {
    const jSchema = buildSchema({ type: 'string', enum: ['a', 'b'] })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.enum(['a', 'b'])
    assert(zSchema).toEqual(expected)
  })

  test('should map OptionalSchema to ZodOptional', () => {
    const jSchema = buildSchema(
      { anyOf: [{ type: 'string' }, undefinedSchema()] },
      { def: { typeName: 'ZodOptional' } },
    )
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.string().optional()
    assert(zSchema).toEqual(expected)
  })

  test('should map NullableSchema to ZodNullable', () => {
    const jSchema = buildSchema({ anyOf: [{ type: 'string' }, nullSchema()] }, { def: { typeName: 'ZodNullable' } })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.string().nullable()
    assert(zSchema).toEqual(expected)
  })

  test('should map ZuiJsonSchema to ZodDefault if it contains default anotation', () => {
    const jSchema = buildSchema({ type: 'string', default: 'hello' })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.string().default('hello')
    assert(zSchema).toEqual(expected)
  })

  test('should map ZuiJsonSchema to ZodReadonly if it contains readOnly anotation', () => {
    const jSchema = buildSchema({ type: 'string', readOnly: true })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.string().readonly()
    assert(zSchema).toEqual(expected)
  })

  test('should map RefSchema to ZodRef', () => {
    const jSchema = buildSchema({ $ref: 'foo' })
    const zSchema = fromJsonSchema(jSchema)
    const expected = z.ref('foo')
    assert(zSchema).toEqual(expected)
  })
})
