import z from '../../z'
import { describe, test, expect } from 'vitest'
import { fromJSONSchema } from './index'
import { JSONSchema7 } from 'json-schema'
import { Schema as ZuiJSONSchema } from '../common/json-schema'
import { toJSONSchema } from '../zui-to-json-schema'
import { toTypescriptType } from '../zui-to-typescript-type'

const buildSchema = (s: JSONSchema7, xZui: ZuiJSONSchema['x-zui'] = undefined): JSONSchema7 => {
  return { ...s, 'x-zui': xZui } as JSONSchema7
}

const undefinedSchema = (xZui?: ZuiJSONSchema['x-zui']): JSONSchema7 =>
  buildSchema({ not: true }, { ...xZui, def: { typeName: z.ZodFirstPartyTypeKind.ZodUndefined } })

const nullSchema = (xZui?: ZuiJSONSchema['x-zui']): JSONSchema7 => buildSchema({ type: 'null' }, xZui)

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

describe.concurrent('zuifromJSONSchemaNext', () => {
  test('should map StringSchema to ZodString', () => {
    const jSchema = buildSchema({ type: 'string' })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.string()
    assert(zSchema).toEqual(expected)
  })

  test('should map NumberSchema to ZodNumber', () => {
    const jSchema = buildSchema({ type: 'number' })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.number()
    assert(zSchema).toEqual(expected)
  })

  test('should map BooleanSchema to ZodBoolean', () => {
    const jSchema = buildSchema({ type: 'boolean' })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.boolean()
    assert(zSchema).toEqual(expected)
  })

  test('should map UndefinedSchema to ZodUndefined', () => {
    const jSchema = buildSchema({ not: true }, { def: { typeName: 'ZodUndefined' } })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.undefined()
    assert(zSchema).toEqual(expected)
  })

  test('should map NullSchema to ZodNull', () => {
    const jSchema = buildSchema({ type: 'null' }, { def: { typeName: 'ZodNull' } })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.null()
    assert(zSchema).toEqual(expected)
  })

  test('should map AnySchema to ZodAny', () => {
    const jSchema = buildSchema({})
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.any()
    assert(zSchema).toEqual(expected)
  })

  test('should map UnknownSchema to ZodUnknown', () => {
    const jSchema = buildSchema({}, { def: { typeName: 'ZodUnknown' } })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.unknown()
    assert(zSchema).toEqual(expected)
  })

  test('should map NeverSchema to ZodNever', () => {
    const jSchema = buildSchema({ not: true })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.never()
    assert(zSchema).toEqual(expected)
  })

  describe.concurrent('ArraySchema', () => {
    test('should map ArraySchema to ZodArray', () => {
      const jSchema = buildSchema({ type: 'array', items: { type: 'string' } })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.array(z.string())
      assert(zSchema).toEqual(expected)
    })

    test('should map ArraySchema with min to ZodArray', () => {
      const jSchema = buildSchema({ type: 'array', items: { type: 'string' }, minItems: 4 })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.array(z.string()).min(4)
      assert(zSchema).toEqual(expected)
    })

    test('should map ArraySchema with min and max to ZodArray', () => {
      const jSchema = buildSchema({ type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 8 })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.array(z.string()).min(4).max(8)
      assert(zSchema).toEqual(expected)
    })

    test('should map ArraySchema with exact size to ZodArray', () => {
      const jSchema = buildSchema({ type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.array(z.string()).length(4)
      assert(zSchema).toEqual(expected)
    })
  })

  test('should map ObjectSchema to ZodObject', () => {
    const jSchema = buildSchema({ type: 'object', properties: { name: { type: 'string' } }, required: ['name'] })
    const zSchema = fromJSONSchema(jSchema)
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
    const zSchema = fromJSONSchema(jSchema)
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
    const zSchema = fromJSONSchema(jSchema)
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
    const zSchema = fromJSONSchema(jSchema)
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
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.object({ name: z.string() }).strict()
    assert(zSchema).toEqual(expected)
  })

  test('should map UnionSchema to ZodUnion', () => {
    const jSchema = buildSchema({ anyOf: [{ type: 'string' }, { type: 'number' }] })
    const zSchema = fromJSONSchema(jSchema)
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
    const zSchema = fromJSONSchema(jSchema)
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
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.intersection(z.object({ a: z.string() }), z.object({ b: z.number() }))
    assert(zSchema).toEqual(expected)
  })

  test('should map TupleSchema to ZodTuple', () => {
    const jSchema = buildSchema({ type: 'array', items: [{ type: 'string' }, { type: 'number' }] })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.tuple([z.string(), z.number()])
    assert(zSchema).toEqual(expected)
  })

  test('should map RecordSchema to ZodRecord', () => {
    const jSchema = buildSchema({ type: 'object', additionalProperties: { type: 'number' } })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.record(z.number())
    assert(zSchema).toEqual(expected)
  })

  describe.concurrent('SetSchema', () => {
    test('should map SetSchema to ZodSet', () => {
      const jSchema = buildSchema({ type: 'array', items: { type: 'string' }, uniqueItems: true })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.set(z.string())
      assert(zSchema).toEqual(expected)
    })

    test('should map SetSchema with min to ZodSet', () => {
      const jSchema = buildSchema({ type: 'array', items: { type: 'string' }, uniqueItems: true, minItems: 4 })
      const zSchema = fromJSONSchema(jSchema)
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
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.set(z.string()).min(4).max(8)
      assert(zSchema).toEqual(expected)
    })
  })

  test('should map LiteralStringSchema to ZodLiteral', () => {
    const jSchema = buildSchema({ type: 'string', const: 'a' })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.literal('a')
    assert(zSchema).toEqual(expected)
  })

  test('should map LiteralNumberSchema to ZodLiteral', () => {
    const jSchema = buildSchema({ type: 'number', const: 1 })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.literal(1)
    assert(zSchema).toEqual(expected)
  })

  test('should map LiteralBooleanSchema to ZodLiteral', () => {
    const jSchema = buildSchema({ type: 'boolean', const: true })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.literal(true)
    assert(zSchema).toEqual(expected)
  })

  test('should map EnumSchema to ZodEnum', () => {
    const jSchema = buildSchema({ type: 'string', enum: ['a', 'b'] })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.enum(['a', 'b'])
    assert(zSchema).toEqual(expected)
  })

  test('should map OptionalSchema to ZodOptional', () => {
    const jSchema = buildSchema(
      { anyOf: [{ type: 'string' }, undefinedSchema()] },
      { def: { typeName: 'ZodOptional' } },
    )
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.string().optional()
    assert(zSchema).toEqual(expected)
  })

  test('should map NullableSchema to ZodNullable', () => {
    const jSchema = buildSchema({ anyOf: [{ type: 'string' }, nullSchema()] }, { def: { typeName: 'ZodNullable' } })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.string().nullable()
    assert(zSchema).toEqual(expected)
  })

  test('should map ZuiJSONSchema to ZodDefault if it contains default anotation', () => {
    const jSchema = buildSchema({ type: 'string', default: 'hello' })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.string().default('hello')
    assert(zSchema).toEqual(expected)
  })

  test('should map ZuiJSONSchema to ZodReadonly if it contains readOnly anotation', () => {
    const jSchema = buildSchema({ type: 'string', readOnly: true })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.string().readonly()
    assert(zSchema).toEqual(expected)
  })

  test('should map RefSchema to ZodRef', () => {
    const jSchema = buildSchema({ $ref: 'foo' })
    const zSchema = fromJSONSchema(jSchema)
    const expected = z.ref('foo')
    assert(zSchema).toEqual(expected)
  })

  describe.concurrent('descriptions', () => {
    test('should restore description from StringSchema', () => {
      const jSchema = buildSchema({ type: 'string', description: 'A string field' })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.string().describe('A string field')
      expect(zSchema._def.description).toBe('A string field')
      assert(zSchema).toEqual(expected)
    })

    test('should restore description from NumberSchema', () => {
      const jSchema = buildSchema({ type: 'number', description: 'A number field' })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.number().describe('A number field')
      expect(zSchema._def.description).toBe('A number field')
      assert(zSchema).toEqual(expected)
    })

    test('should restore description from BooleanSchema', () => {
      const jSchema = buildSchema({ type: 'boolean', description: 'A boolean field' })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.boolean().describe('A boolean field')
      expect(zSchema._def.description).toBe('A boolean field')
      assert(zSchema).toEqual(expected)
    })

    test('should restore description from ArraySchema', () => {
      const jSchema = buildSchema({ type: 'array', items: { type: 'string' }, description: 'An array of strings' })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.array(z.string()).describe('An array of strings')
      expect(zSchema._def.description).toBe('An array of strings')
      assert(zSchema).toEqual(expected)
    })

    test('should restore description from ObjectSchema', () => {
      const jSchema = buildSchema({
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
        description: 'An object with a name',
      })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.object({ name: z.string() }).describe('An object with a name')
      expect(zSchema._def.description).toBe('An object with a name')
      assert(zSchema).toEqual(expected)
    })

    test('should restore description from nested ObjectSchema properties', () => {
      const jSchema = buildSchema({
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The name field' },
          age: { type: 'number', description: 'The age field' },
        },
        required: ['name'],
      })
      const zSchema = fromJSONSchema(jSchema) as z.ZodObject
      const expected = z.object({
        name: z.string().describe('The name field'),
        age: z.number().optional().describe('The age field'),
      })
      const shape = zSchema._def.shape()
      expect(shape.name?._def.description).toBe('The name field')
      expect((shape.age as z.ZodOptional<z.ZodNumber>)?._def.innerType._def.description).toBe('The age field')
      assert(zSchema).toEqual(expected)
    })

    test('should restore description from UnionSchema', () => {
      const jSchema = buildSchema({
        anyOf: [{ type: 'string' }, { type: 'number' }],
        description: 'A union of string or number',
      })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.union([z.string(), z.number()]).describe('A union of string or number')
      expect(zSchema._def.description).toBe('A union of string or number')
      assert(zSchema).toEqual(expected)
    })

    test('should restore description from LiteralSchema', () => {
      const jSchema = buildSchema({ type: 'string', const: 'foo', description: 'A literal value' })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.literal('foo').describe('A literal value')
      expect(zSchema._def.description).toBe('A literal value')
      assert(zSchema).toEqual(expected)
    })

    test('should restore description from EnumSchema', () => {
      const jSchema = buildSchema({ type: 'string', enum: ['a', 'b'], description: 'An enum of values' })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.enum(['a', 'b']).describe('An enum of values')
      expect(zSchema._def.description).toBe('An enum of values')
      assert(zSchema).toEqual(expected)
    })

    test('should restore description from SetSchema', () => {
      const jSchema = buildSchema({
        type: 'array',
        items: { type: 'string' },
        uniqueItems: true,
        description: 'A set of strings',
      })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.set(z.string()).describe('A set of strings')
      expect(zSchema._def.description).toBe('A set of strings')
      assert(zSchema).toEqual(expected)
    })

    test('should restore description from TupleSchema', () => {
      const jSchema = buildSchema({
        type: 'array',
        items: [{ type: 'string' }, { type: 'number' }],
        description: 'A tuple of string and number',
      })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.tuple([z.string(), z.number()]).describe('A tuple of string and number')
      expect(zSchema._def.description).toBe('A tuple of string and number')
      assert(zSchema).toEqual(expected)
    })

    test('should restore description from RecordSchema', () => {
      const jSchema = buildSchema({
        type: 'object',
        additionalProperties: { type: 'number' },
        description: 'A record of numbers',
      })
      const zSchema = fromJSONSchema(jSchema)
      const expected = z.record(z.number()).describe('A record of numbers')
      expect(zSchema._def.description).toBe('A record of numbers')
      assert(zSchema).toEqual(expected)
    })
  })

  describe.concurrent('round-trip: zui → json → zui preserves typescript types', () => {
    const roundTrip = (schema: z.Schema): z.Schema => {
      const jsonSchema = toJSONSchema(schema)
      return fromJSONSchema(jsonSchema as JSONSchema7)
    }

    const getTypescriptType = (schema: z.Schema, title = 'Test'): string => {
      return toTypescriptType(schema.title(title), { declaration: true })
    }

    test('should preserve string with description', () => {
      const original = z.string().describe('A string field')
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      expect(restored._def.description).toBe('A string field')
    })

    test('should preserve number with description', () => {
      const original = z.number().describe('A number field')
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      expect(restored._def.description).toBe('A number field')
    })

    test('should preserve boolean with description', () => {
      const original = z.boolean().describe('A boolean field')
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      expect(restored._def.description).toBe('A boolean field')
    })

    test('should preserve array with description', () => {
      const original = z.array(z.string()).describe('An array of strings')
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      expect(restored._def.description).toBe('An array of strings')
    })

    test('should preserve object with description', () => {
      const original = z
        .object({
          name: z.string(),
          age: z.number(),
        })
        .describe('A person object')
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      expect(restored._def.description).toBe('A person object')
    })

    test('should preserve object with nested property descriptions', () => {
      const original = z.object({
        name: z.string().describe('The person name'),
        age: z.number().describe('The person age'),
        email: z.string().email().describe('The person email'),
      })
      const restored = roundTrip(original) as z.ZodObject

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))

      const originalShape = original._def.shape()
      const restoredShape = restored._def.shape()
      expect(restoredShape.name?._def.description).toBe(originalShape.name._def.description)
      expect(restoredShape.age?._def.description).toBe(originalShape.age._def.description)
      expect(restoredShape.email?._def.description).toBe(originalShape.email._def.description)
    })

    test('should preserve optional fields with descriptions', () => {
      const original = z.object({
        name: z.string().describe('Required name'),
        nickname: z.string().optional().describe('Optional nickname'),
      })
      const restored = roundTrip(original) as z.ZodObject

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))

      const restoredShape = restored._def.shape()
      expect(restoredShape.name?._def.description).toBe('Required name')
      expect((restoredShape.nickname as z.ZodOptional<z.ZodString>)?._def.innerType._def.description).toBe(
        'Optional nickname',
      )
    })

    test('should preserve union with description', () => {
      const original = z.union([z.string(), z.number()]).describe('String or number')
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      expect(restored._def.description).toBe('String or number')
    })

    test('should preserve enum with description', () => {
      const original = z.enum(['a', 'b', 'c']).describe('Letter options')
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      expect(restored._def.description).toBe('Letter options')
    })

    test('should preserve literal with description', () => {
      const original = z.literal('foo').describe('Always foo')
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      expect(restored._def.description).toBe('Always foo')
    })

    test('should preserve tuple with description', () => {
      const original = z.tuple([z.string(), z.number()]).describe('Name and age tuple')
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      expect(restored._def.description).toBe('Name and age tuple')
    })

    test('should preserve record with description', () => {
      const original = z.record(z.number()).describe('String to number map')
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      expect(restored._def.description).toBe('String to number map')
    })

    test('should preserve set with description', () => {
      const original = z.set(z.string()).describe('Unique strings')
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      expect(restored._def.description).toBe('Unique strings')
    })

    test('should preserve complex nested schema with descriptions', () => {
      const original = z
        .object({
          user: z
            .object({
              id: z.number().describe('User ID'),
              profile: z
                .object({
                  name: z.string().describe('Full name'),
                  bio: z.string().optional().describe('Biography'),
                })
                .describe('User profile'),
            })
            .describe('User object'),
          tags: z.array(z.string()).describe('User tags'),
          metadata: z.record(z.string()).optional().describe('Additional metadata'),
        })
        .describe('Complete user data')

      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      expect(restored._def.description).toBe('Complete user data')
    })

    test('should preserve default values with descriptions', () => {
      const original = z.object({
        name: z.string().describe('User name'),
        role: z.string().default('user').describe('User role'),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve string refinements with descriptions', () => {
      const original = z.object({
        email: z.string().email().describe('Email address'),
        url: z.string().url().describe('Website URL'),
        uuid: z.string().uuid().describe('Unique identifier'),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve number constraints with descriptions', () => {
      const original = z.object({
        age: z.number().min(0).max(120).describe('Person age'),
        rating: z.number().min(1).max(5).int().describe('Star rating'),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve array constraints with descriptions', () => {
      const original = z.object({
        tags: z.array(z.string()).min(1).max(10).describe('Tag list'),
        items: z.array(z.number()).length(5).describe('Exactly 5 items'),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve discriminated union with descriptions', () => {
      const original = z
        .union([
          z.object({ type: z.literal('success'), data: z.string().describe('Success data') }),
          z.object({ type: z.literal('error'), message: z.string().describe('Error message') }),
        ])
        .describe('API Response')

      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      expect(restored._def.description).toBe('API Response')
    })

    test('should preserve nullable fields', () => {
      const original = z.object({
        name: z.string(),
        nickname: z.string().nullable(),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve nullable with description', () => {
      const original = z.string().nullable().describe('Nullable string')
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      expect(restored._def.description).toBe('Nullable string')
    })

    test('should preserve optional with describe', () => {
      const original = z.string().optional().describe('Optional string')
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      const innerType = (restored as z.ZodOptional<z.ZodString>)._def.innerType
      expect(innerType._def.description).toBe('Optional string')
    })

    test('should preserve describe on optional', () => {
      const original = z.string().describe('A string').optional()
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      const innerType = (restored as z.ZodOptional<z.ZodString>)._def.innerType
      expect(innerType._def.description).toBe('A string')
    })

    test('should preserve literal values', () => {
      const original = z.object({
        stringLit: z.literal('hello'),
        numberLit: z.literal(42),
        boolLit: z.literal(true),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve union of literals', () => {
      const original = z.union([z.literal('a'), z.literal('b'), z.literal('c')])
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve union with .or() syntax', () => {
      const original = z.string().or(z.number())
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve complex union with multiple types', () => {
      const original = z.union([z.string(), z.number(), z.boolean(), z.null()])
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve enum values', () => {
      const original = z.enum(['red', 'green', 'blue'])
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve enum with describe', () => {
      const original = z.enum(['small', 'medium', 'large']).describe('Size options')
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      expect(restored._def.description).toBe('Size options')
    })

    test('should preserve default values', () => {
      const original = z.object({
        name: z.string(),
        role: z.string().default('guest'),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve readonly fields', () => {
      const original = z.object({
        id: z.number().readonly(),
        name: z.string(),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve readonly with describe', () => {
      const original = z.string().readonly().describe('Read-only field')
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
      const innerType = (restored as z.ZodReadonly<z.ZodString>)._def.innerType
      expect(innerType._def.description).toBe('Read-only field')
    })

    test('should preserve intersection types', () => {
      const original = z.intersection(z.object({ a: z.string() }), z.object({ b: z.number() }))
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve complex intersection with descriptions', () => {
      const original = z.intersection(
        z
          .object({
            id: z.number().describe('Entity ID'),
          })
          .describe('Base entity'),
        z
          .object({
            name: z.string().describe('Entity name'),
          })
          .describe('Named entity'),
      )
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve tuple with rest element', () => {
      const original = z.tuple([z.string(), z.number()]).rest(z.boolean())
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve nested unions', () => {
      const original = z.object({
        status: z.union([z.literal('active'), z.literal('inactive')]),
        type: z.union([z.literal('user'), z.literal('admin')]),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve object with passthrough', () => {
      const original = z
        .object({
          name: z.string(),
        })
        .passthrough()
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve object with strict', () => {
      const original = z
        .object({
          name: z.string(),
        })
        .strict()
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve object with catchall', () => {
      const original = z
        .object({
          name: z.string(),
        })
        .catchall(z.number())
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve deeply nested optional fields', () => {
      const original = z.object({
        user: z.object({
          profile: z
            .object({
              bio: z.string().optional(),
              avatar: z.string().url().optional(),
            })
            .optional(),
        }),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve mixed optional and nullable', () => {
      const original = z.object({
        optionalField: z.string().optional(),
        nullableField: z.string().nullable(),
        optionalNullable: z.string().nullable().optional(),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve union with optional', () => {
      const original = z.union([z.string(), z.number()]).optional()
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve union with nullable', () => {
      const original = z.union([z.string(), z.number()]).nullable()
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve array with nullable elements', () => {
      const original = z.array(z.string().nullable())
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve record with complex value types', () => {
      const original = z.record(
        z.object({
          value: z.number(),
          label: z.string(),
        }),
      )
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve set with constraints', () => {
      const original = z.set(z.string()).min(1).max(10)
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve complex discriminated union structure', () => {
      const original = z.union([
        z.object({
          kind: z.literal('circle'),
          radius: z.number(),
        }),
        z.object({
          kind: z.literal('square'),
          sideLength: z.number(),
        }),
        z.object({
          kind: z.literal('rectangle'),
          width: z.number(),
          height: z.number(),
        }),
      ])
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve union of objects with optional fields', () => {
      const original = z.union([
        z.object({
          type: z.literal('A'),
          value: z.string(),
          extra: z.number().optional(),
        }),
        z.object({
          type: z.literal('B'),
          data: z.boolean(),
          meta: z.string().optional(),
        }),
      ])
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve deeply nested arrays', () => {
      const original = z.array(z.array(z.array(z.number())))
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve tuple with optional elements', () => {
      const original = z.tuple([z.string(), z.number().optional()])
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve object with all modifier combinations', () => {
      const original = z.object({
        required: z.string(),
        optional: z.string().optional(),
        nullable: z.string().nullable(),
        withDefault: z.string().default('default'),
        nullableWithDefault: z.string().nullable().default('default'),
        readonly: z.string().readonly(),
        described: z.string().describe('A field'),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve literal union (enum-like)', () => {
      const original = z.union([z.literal(1), z.literal(2), z.literal(3)])
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve mixed type literal union', () => {
      const original = z.union([z.literal('string'), z.literal(42), z.literal(true)])
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve recursive-like structure', () => {
      const original = z.object({
        value: z.string(),
        children: z
          .array(
            z.object({
              value: z.string(),
              children: z.array(z.any()).optional(),
            }),
          )
          .optional(),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve union with describe on each member', () => {
      const original = z.union([z.string().describe('Text input'), z.number().describe('Numeric input')])
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve all array constraint types', () => {
      const original = z.object({
        minArray: z.array(z.string()).min(1),
        maxArray: z.array(z.string()).max(10),
        lengthArray: z.array(z.string()).length(5),
        minMaxArray: z.array(z.string()).min(2).max(8),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve string with multiple refinements', () => {
      const original = z.object({
        email: z.string().email(),
        url: z.string().url(),
        uuid: z.string().uuid(),
        cuid: z.string().cuid(),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve number with all constraints', () => {
      const original = z.object({
        min: z.number().min(0),
        max: z.number().max(100),
        int: z.number().int(),
        positive: z.number().positive(),
        nonnegative: z.number().nonnegative(),
        negative: z.number().negative(),
        nonpositive: z.number().nonpositive(),
        multipleOf: z.number().multipleOf(5),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })

    test('should preserve combined number constraints', () => {
      const original = z.object({
        percentage: z.number().min(0).max(100).int(),
        score: z.number().min(1).max(10).multipleOf(0.5),
      })
      const restored = roundTrip(original)

      expect(getTypescriptType(original)).toBe(getTypescriptType(restored))
    })
  })
})
