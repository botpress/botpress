import * as errs from '../common/errors'
import z from '../../z'
import { describe, test, expect } from 'vitest'
import { toJSONSchema } from './index'

describe('zuiToJSONSchemaNext', () => {
  test('should map ZodString to StringSchema', () => {
    const schema = toJSONSchema(z.string())
    expect(schema).toEqual({ type: 'string' })
  })

  test('should map ZodNumber to NumberSchema', () => {
    const schema = toJSONSchema(z.number())
    expect(schema).toEqual({ type: 'number' })
  })

  test('should not support ZodNaN', () => {
    expect(() => toJSONSchema(z.nan())).toThrowError(errs.UnsupportedZuiToJSONSchemaError)
  })

  test('should not support ZodBigInt', () => {
    expect(() => toJSONSchema(z.bigint())).toThrowError(errs.UnsupportedZuiToJSONSchemaError)
  })

  test('should map ZodBoolean to BooleanSchema', () => {
    const schema = toJSONSchema(z.boolean())
    expect(schema).toEqual({ type: 'boolean' })
  })

  test('should not support ZodDate', () => {
    expect(() => toJSONSchema(z.date())).toThrowError(errs.UnsupportedZuiToJSONSchemaError)
  })

  test('should map ZodUndefined to UndefinedSchema', () => {
    const schema = toJSONSchema(z.undefined())
    expect(schema).toEqual({ not: true, 'x-zui': { def: { typeName: 'ZodUndefined' } } })
  })

  test('should map ZodNull to NullSchema', () => {
    const schema = toJSONSchema(z.null())
    expect(schema).toEqual({ type: 'null' })
  })

  test('should map ZodAny to AnySchema', () => {
    const schema = toJSONSchema(z.any())
    expect(schema).toEqual({})
  })

  test('should map ZodUnknown to UnknownSchema', () => {
    const schema = toJSONSchema(z.unknown())
    expect(schema).toEqual({ 'x-zui': { def: { typeName: 'ZodUnknown' } } })
  })

  test('should map ZodNever to NeverSchema', () => {
    const schema = toJSONSchema(z.never())
    expect(schema).toEqual({ not: true })
  })

  test('should not support ZodVoid', () => {
    expect(() => toJSONSchema(z.void())).toThrowError(errs.UnsupportedZuiToJSONSchemaError)
  })

  test('should map ZodArray to ArraySchema', () => {
    const schema = toJSONSchema(z.array(z.string()))
    expect(schema).toEqual({ type: 'array', items: { type: 'string' } })
  })

  test('should map ZodObject to ObjectSchema', () => {
    const schema = toJSONSchema(z.object({ name: z.string() }))
    expect(schema).toEqual({
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
      additionalProperties: false,
    })
  })

  test('should map ZodObject with optional fields to ObjectSchema', () => {
    const schema = toJSONSchema(
      z.object({
        name: z.string(),
        age: z.number().optional(),
        data: z.union([z.string(), z.null(), z.undefined()]),
        email: z.string().optional().readonly(),
      }),
    )
    expect(schema).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
        data: {
          anyOf: [{ type: 'string' }, { type: 'null' }],
        },
        email: { type: 'string', readOnly: true },
      },
      required: ['name'],
      additionalProperties: false,
    })
  })

  test('should map strict ZodObject to ObjectSchema with addtionalProperties never', () => {
    const schema = toJSONSchema(z.object({ name: z.string() }).strict())
    expect(schema).toEqual({
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
      additionalProperties: false,
    })
  })

  test('should map passthrough ZodObject to ObjectSchema with addtionalProperties any', () => {
    const schema = toJSONSchema(z.object({ name: z.string() }).passthrough())
    expect(schema).toEqual({
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
      additionalProperties: true,
    })
  })

  test('should map ZodObject with catchall ZodNumber to ObjectSchema with addtionalProperties number', () => {
    const schema = toJSONSchema(z.object({ name: z.string() }).catchall(z.number()))
    expect(schema).toEqual({
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
      additionalProperties: { type: 'number' },
    })
  })

  test('should preserve ZodObject nested properties descriptions', () => {
    const description1 = 'The ID or Name of the table'
    const description2 = 'Notes about the task'
    const description3 = 'The ID of the user who will be assigned to the task'
    const schema = toJSONSchema(
      z.object({
        tableIdOrName: z.string().describe(description1),
        notes: z.string().optional().describe(description2),
        assignee: z.string().optional().default('me').describe(description3),
      }),
    )
    expect(schema).toEqual({
      type: 'object',
      properties: {
        tableIdOrName: {
          type: 'string',
          description: description1,
        },
        notes: {
          type: 'string',
          description: description2,
        },
        assignee: {
          type: 'string',
          description: description3,
          default: 'me',
        },
      },
      required: ['tableIdOrName'],
      additionalProperties: false,
    })
  })

  test('should map ZodUnion to UnionSchema', () => {
    const schema = toJSONSchema(z.union([z.string(), z.number()]))
    expect(schema).toEqual({
      anyOf: [{ type: 'string' }, { type: 'number' }],
    })
  })

  test('should map ZodDiscriminatedUnion to UnionSchema', () => {
    const schema = toJSONSchema(
      z.discriminatedUnion('type', [
        z.object({ type: z.literal('A'), a: z.string() }),
        z.object({ type: z.literal('B'), b: z.number() }),
      ]),
    )
    expect(schema).toEqual({
      anyOf: [
        {
          type: 'object',
          properties: { type: { type: 'string', const: 'A' }, a: { type: 'string' } },
          required: ['type', 'a'],
          additionalProperties: false,
        },
        {
          type: 'object',
          properties: { type: { type: 'string', const: 'B' }, b: { type: 'number' } },
          required: ['type', 'b'],
          additionalProperties: false,
        },
      ],
    })
  })

  test('should map ZodIntersection to IntersectionSchema', () => {
    const schema = toJSONSchema(z.intersection(z.object({ a: z.string() }), z.object({ b: z.number() })))
    expect(schema).toEqual({
      allOf: [
        {
          type: 'object',
          properties: { a: { type: 'string' } },
          required: ['a'],
        },
        {
          type: 'object',
          properties: { b: { type: 'number' } },
          required: ['b'],
        },
      ],
    })
  })

  test('should map ZodIntersection of strict schemas to IntersectionSchema removing additional properties', () => {
    const schema = toJSONSchema(
      z.intersection(
        z.object({ a: z.string() }).strict(), //
        z.object({ b: z.number() }).strict(),
      ),
    )

    expect(schema).toEqual({
      allOf: [
        {
          type: 'object',
          properties: { a: { type: 'string' } },
          required: ['a'],
        },
        {
          type: 'object',
          properties: { b: { type: 'number' } },
          required: ['b'],
        },
      ],
    })
  })

  test('should map ZodTuple to TupleSchema', () => {
    const schema = toJSONSchema(z.tuple([z.string(), z.number()]))
    expect(schema).toEqual({
      type: 'array',
      items: [{ type: 'string' }, { type: 'number' }],
    })
  })

  test('should map ZodRecord to RecordSchema', () => {
    const schema = toJSONSchema(z.record(z.number()))
    expect(schema).toEqual({
      type: 'object',
      additionalProperties: { type: 'number' },
    })
  })

  test('should not support ZodMap', () => {
    expect(() => toJSONSchema(z.map(z.string(), z.number()))).toThrowError(errs.UnsupportedZuiToJSONSchemaError)
  })

  test('should map ZodSet to SetSchema', () => {
    const schema = toJSONSchema(z.set(z.string()))
    expect(schema).toEqual({
      type: 'array',
      items: { type: 'string' },
      uniqueItems: true,
    })
  })

  test('should not support ZodFunction', () => {
    expect(() => toJSONSchema(z.function())).toThrowError(errs.UnsupportedZuiToJSONSchemaError)
  })

  test('should not support ZodLazy', () => {
    expect(() => toJSONSchema(z.lazy(() => z.string()))).toThrowError(errs.UnsupportedZuiToJSONSchemaError)
  })

  test('should map ZodLiteral to LiteralSchema', () => {
    const stringSchema = toJSONSchema(z.literal('a'))
    expect(stringSchema).toEqual({ type: 'string', const: 'a' })

    const numberSchema = toJSONSchema(z.literal(1))
    expect(numberSchema).toEqual({ type: 'number', const: 1 })

    const booleanSchema = toJSONSchema(z.literal(true))
    expect(booleanSchema).toEqual({ type: 'boolean', const: true })

    const nullSchema = toJSONSchema(z.literal(null))
    expect(nullSchema).toEqual({ type: 'null' })

    const undefinedSchema = toJSONSchema(z.literal(undefined))
    expect(undefinedSchema).toEqual({ not: true, 'x-zui': { def: { typeName: 'ZodUndefined' } } })

    expect(() => toJSONSchema(z.literal(BigInt(1)))).toThrowError(errs.ZuiToJSONSchemaError)
    expect(() => toJSONSchema(z.literal(Symbol('a')))).toThrowError(errs.ZuiToJSONSchemaError)
  })

  test('should map ZodEnum to EnumSchema', () => {
    const schema = toJSONSchema(z.enum(['a', 'b']))
    expect(schema).toEqual({
      type: 'string',
      enum: ['a', 'b'],
    })
  })

  test('should not support ZodEffects', () => {
    expect(() => toJSONSchema(z.string().refine((s) => s === s.toUpperCase()))).toThrowError(
      errs.UnsupportedZuiToJSONSchemaError,
    )
    expect(() => toJSONSchema(z.string().transform((s) => s.toUpperCase()))).toThrowError(
      errs.UnsupportedZuiToJSONSchemaError,
    )
  })

  test('should not support ZodNativeEnum', () => {
    enum Fruit {
      Apple = 'apple',
      Banana = 'banana',
    }
    expect(() => toJSONSchema(z.nativeEnum(Fruit))).toThrowError(errs.UnsupportedZuiToJSONSchemaError)
  })

  test('should map ZodOptional to OptionalSchema', () => {
    const schema = toJSONSchema(z.string().optional())
    expect(schema).toEqual({
      anyOf: [{ type: 'string' }, { not: true, 'x-zui': { def: { typeName: 'ZodUndefined' } } }],
      'x-zui': { def: { typeName: 'ZodOptional' } },
    })
  })

  test('should map ZodNullable to NullableSchema', () => {
    const schema = toJSONSchema(z.string().nullable())
    expect(schema).toEqual({
      anyOf: [{ type: 'string' }, { type: 'null' }],
      'x-zui': { def: { typeName: 'ZodNullable' } },
    })
  })

  test('should map ZodDefault to ZuiJSONSchema with default anotation', () => {
    const schema = toJSONSchema(z.string().default('hello'))
    expect(schema).toEqual({
      type: 'string',
      default: 'hello',
    })
  })

  test('should not support ZodCatch', () => {
    expect(() => toJSONSchema(z.string().catch('apple'))).toThrowError(errs.UnsupportedZuiToJSONSchemaError)
  })

  test('should not support ZodPromise', () => {
    expect(() => toJSONSchema(z.string().promise())).toThrowError(errs.UnsupportedZuiToJSONSchemaError)
  })

  test('should not support ZodBranded', () => {
    expect(() => toJSONSchema(z.string().brand('apple'))).toThrowError(errs.UnsupportedZuiToJSONSchemaError)
  })

  test('should not support ZodPipeline', () => {
    expect(() => toJSONSchema(z.string().pipe(z.string()))).toThrowError(errs.UnsupportedZuiToJSONSchemaError)
  })

  test('should not support ZodSymbol', () => {
    expect(() => toJSONSchema(z.symbol())).toThrowError(errs.UnsupportedZuiToJSONSchemaError)
  })

  test('should map ZodReadonly to ZuiJSONSchema with readOnly anotation', () => {
    const schema = toJSONSchema(z.string().readonly())
    expect(schema).toEqual({
      type: 'string',
      readOnly: true,
    })
  })

  test('should map ZodRef to RefSchema', () => {
    const schema = toJSONSchema(z.ref('foo'))
    expect(schema).toEqual({ $ref: 'foo' })
  })
})
