import { describe, it, expect } from 'vitest'
import { zodToJsonSchema } from '../zodToJsonSchema'
import { z } from '../../../z/index'

enum nativeEnum {
  'a',
  'b',
  'c',
}

export const allParsersSchema = z
  .object({
    any: z.any(),
    array: z.array(z.any()),
    arrayMin: z.array(z.any()).min(1),
    arrayMax: z.array(z.any()).max(1),
    arrayMinMax: z.array(z.any()).min(1).max(1),
    bigInt: z.bigint(),
    boolean: z.boolean(),
    date: z.date(),
    default: z.any().default(42),
    effectRefine: z.string().refine((x) => x + x),
    effectTransform: z.string().transform((x) => !!x),
    effectPreprocess: z.preprocess((x) => {
      try {
        return JSON.stringify(x)
      } catch {
        return 'wahh'
      }
    }, z.string()),
    enum: z.enum(['hej', 'svejs']),
    intersection: z.intersection(z.string().min(1), z.string().max(4)),
    literal: z.literal('hej'),
    map: z.map(z.string().uuid(), z.boolean()),
    nativeEnum: z.nativeEnum(nativeEnum),
    never: z.never() as any,
    null: z.null(),
    nullablePrimitive: z.string().nullable(),
    nullable: z.object({ hello: z.string() }).nullable(),
    number: z.number(),
    numberGt: z.number().gt(1),
    numberLt: z.number().lt(1),
    numberGtLt: z.number().gt(1).lt(1),
    numberGte: z.number().gte(1),
    numberLte: z.number().lte(1),
    numberGteLte: z.number().gte(1).lte(1),
    numberMultipleOf: z.number().multipleOf(2),
    numberInt: z.number().int(),
    objectPasstrough: z.object({ foo: z.string(), bar: z.number().optional() }).passthrough(),
    objectCatchall: z.object({ foo: z.string(), bar: z.number().optional() }).catchall(z.boolean()),
    objectStrict: z.object({ foo: z.string(), bar: z.number().optional() }).strict(),
    objectStrip: z.object({ foo: z.string(), bar: z.number().optional() }).strip(),
    promise: z.promise(z.string()),
    recordStringBoolean: z.record(z.string(), z.boolean()),
    recordUuidBoolean: z.record(z.string().uuid(), z.boolean()),
    recordBooleanBoolean: z.record(z.boolean(), z.boolean()),
    set: z.set(z.string()),
    string: z.string(),
    stringMin: z.string().min(1),
    stringMax: z.string().max(1),
    stringEmail: z.string().email(),
    stringUrl: z.string().url(),
    stringUuid: z.string().uuid(),
    stringRegEx: z.string().regex(new RegExp('abc')),
    stringCuid: z.string().cuid(),
    tuple: z.tuple([z.string(), z.number(), z.boolean()]),
    undefined: z.undefined(),
    unionPrimitives: z.union([z.string(), z.number(), z.boolean(), z.bigint(), z.null()]),
    unionPrimitiveLiterals: z.union([
      z.literal(123),
      z.literal('abc'),
      z.literal(null),
      z.literal(true),
      // z.literal(1n), // target es2020
    ]),
    unionNonPrimitives: z.union([
      z.string(),
      z.object({
        foo: z.string(),
        bar: z.number().optional(),
      }),
    ]),
    unknown: z.unknown(),
  })
  .partial()
  .default({ string: 'hello' })
  .describe('watup')

describe('All Parsers tests', () => {
  it('With JSON schema target, should produce valid json schema (7)', () => {
    const jsonSchema = zodToJsonSchema(allParsersSchema, {
      target: 'jsonSchema7',
    })

    const expectedOutput = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      additionalProperties: false,
      default: {
        string: 'hello',
      },
      description: 'watup',
      properties: {
        any: {
          'x-zui': {},
        },
        array: {
          type: 'array',
          'x-zui': {},
        },
        arrayMax: {
          maxItems: 1,
          type: 'array',
          'x-zui': {},
        },
        arrayMin: {
          minItems: 1,
          type: 'array',
          'x-zui': {},
        },
        arrayMinMax: {
          maxItems: 1,
          minItems: 1,
          type: 'array',
          'x-zui': {},
        },
        bigInt: {
          format: 'int64',
          type: 'integer',
          'x-zui': {},
        },
        boolean: {
          type: 'boolean',
          'x-zui': {},
        },
        date: {
          format: 'date-time',
          type: 'string',
          'x-zui': {},
        },
        default: {
          default: 42,
          'x-zui': {},
        },
        effectPreprocess: {
          type: 'string',
          'x-zui': {},
        },
        effectRefine: {
          type: 'string',
          'x-zui': {},
        },
        effectTransform: {
          type: 'string',
          'x-zui': {},
        },
        enum: {
          enum: ['hej', 'svejs'],
          type: 'string',
          'x-zui': {},
        },
        intersection: {
          allOf: [
            {
              minLength: 1,
              type: 'string',
              'x-zui': {},
            },
            {
              maxLength: 4,
              type: 'string',
              'x-zui': {},
            },
          ],
          'x-zui': {},
        },
        literal: {
          const: 'hej',
          type: 'string',
          'x-zui': {},
        },
        map: {
          items: {
            items: [
              {
                format: 'uuid',
                type: 'string',
                'x-zui': {},
              },
              {
                type: 'boolean',
                'x-zui': {},
              },
            ],
            maxItems: 2,
            minItems: 2,
            type: 'array',
          },
          maxItems: 125,
          type: 'array',
          'x-zui': {},
        },
        nativeEnum: {
          enum: [0, 1, 2],
          type: 'number',
          'x-zui': {},
        },
        never: {
          not: {},
          'x-zui': {},
        },
        null: {
          type: 'null',
          'x-zui': {},
        },
        nullable: {
          anyOf: [
            {
              additionalProperties: false,
              properties: {
                hello: {
                  type: 'string',
                  'x-zui': {},
                },
              },
              required: ['hello'],
              type: 'object',
              'x-zui': {},
            },
            {
              type: 'null',
            },
          ],
          'x-zui': {},
        },
        nullablePrimitive: {
          type: ['string', 'null'],
          'x-zui': {},
        },
        number: {
          type: 'number',
          'x-zui': {},
        },
        numberGt: {
          exclusiveMinimum: 1,
          type: 'number',
          'x-zui': {},
        },
        numberGtLt: {
          exclusiveMaximum: 1,
          exclusiveMinimum: 1,
          type: 'number',
          'x-zui': {},
        },
        numberGte: {
          minimum: 1,
          type: 'number',
          'x-zui': {},
        },
        numberGteLte: {
          maximum: 1,
          minimum: 1,
          type: 'number',
          'x-zui': {},
        },
        numberInt: {
          type: 'integer',
          'x-zui': {},
        },
        numberLt: {
          exclusiveMaximum: 1,
          type: 'number',
          'x-zui': {},
        },
        numberLte: {
          maximum: 1,
          type: 'number',
          'x-zui': {},
        },
        numberMultipleOf: {
          multipleOf: 2,
          type: 'number',
          'x-zui': {},
        },
        objectCatchall: {
          additionalProperties: {
            type: 'boolean',
            'x-zui': {},
          },
          properties: {
            bar: {
              type: 'number',
              'x-zui': {},
            },
            foo: {
              type: 'string',
              'x-zui': {},
            },
          },
          required: ['foo'],
          type: 'object',
          'x-zui': {},
        },
        objectPasstrough: {
          additionalProperties: true,
          properties: {
            bar: {
              type: 'number',
              'x-zui': {},
            },
            foo: {
              type: 'string',
              'x-zui': {},
            },
          },
          required: ['foo'],
          type: 'object',
          'x-zui': {},
        },
        objectStrict: {
          additionalProperties: false,
          properties: {
            bar: {
              type: 'number',
              'x-zui': {},
            },
            foo: {
              type: 'string',
              'x-zui': {},
            },
          },
          required: ['foo'],
          type: 'object',
          'x-zui': {},
        },
        objectStrip: {
          additionalProperties: false,
          properties: {
            bar: {
              type: 'number',
              'x-zui': {},
            },
            foo: {
              type: 'string',
              'x-zui': {},
            },
          },
          required: ['foo'],
          type: 'object',
          'x-zui': {},
        },
        promise: {
          type: 'string',
          'x-zui': {},
        },
        recordBooleanBoolean: {
          additionalProperties: {
            type: 'boolean',
            'x-zui': {},
          },
          type: 'object',
          'x-zui': {},
        },
        recordStringBoolean: {
          additionalProperties: {
            type: 'boolean',
            'x-zui': {},
          },
          type: 'object',
          'x-zui': {},
        },
        recordUuidBoolean: {
          additionalProperties: {
            type: 'boolean',
            'x-zui': {},
          },
          propertyNames: {
            format: 'uuid',
          },
          type: 'object',
          'x-zui': {},
        },
        set: {
          items: {
            type: 'string',
            'x-zui': {},
          },
          type: 'array',
          uniqueItems: true,
          'x-zui': {},
        },
        string: {
          type: 'string',
          'x-zui': {},
        },
        stringCuid: {
          pattern: '^[cC][^\\s-]{8,}$',
          type: 'string',
          'x-zui': {},
        },
        stringEmail: {
          format: 'email',
          type: 'string',
          'x-zui': {},
        },
        stringMax: {
          maxLength: 1,
          type: 'string',
          'x-zui': {},
        },
        stringMin: {
          minLength: 1,
          type: 'string',
          'x-zui': {},
        },
        stringRegEx: {
          pattern: 'abc',
          type: 'string',
          'x-zui': {},
        },
        stringUrl: {
          format: 'uri',
          type: 'string',
          'x-zui': {},
        },
        stringUuid: {
          format: 'uuid',
          type: 'string',
          'x-zui': {},
        },
        tuple: {
          items: [
            {
              type: 'string',
              'x-zui': {},
            },
            {
              type: 'number',
              'x-zui': {},
            },
            {
              type: 'boolean',
              'x-zui': {},
            },
          ],
          maxItems: 3,
          minItems: 3,
          type: 'array',
          'x-zui': {},
        },
        undefined: {
          not: {},
          'x-zui': {},
        },
        unionNonPrimitives: {
          anyOf: [
            {
              type: 'string',
              'x-zui': {},
            },
            {
              additionalProperties: false,
              properties: {
                bar: {
                  type: 'number',
                  'x-zui': {},
                },
                foo: {
                  type: 'string',
                  'x-zui': {},
                },
              },
              required: ['foo'],
              type: 'object',
              'x-zui': {},
            },
          ],
          'x-zui': {},
        },
        unionPrimitiveLiterals: {
          enum: [123, 'abc', null, true],
          type: ['number', 'string', 'null', 'boolean'],
          'x-zui': {},
        },
        unionPrimitives: {
          type: ['string', 'number', 'boolean', 'integer', 'null'],
          'x-zui': {},
        },
        unknown: {
          'x-zui': {},
        },
      },
      type: 'object',
      'x-zui': {},
    }

    expect(jsonSchema).toEqual(expectedOutput)
  })

  it('With OpenAPI schema target, should produce valid Open API schema', () => {
    const jsonSchema = zodToJsonSchema(allParsersSchema, {
      target: 'openApi3',
    })
    const expectedOutput = {
      additionalProperties: false,
      default: {
        string: 'hello',
      },
      description: 'watup',
      properties: {
        any: {
          'x-zui': {},
        },
        array: {
          type: 'array',
          'x-zui': {},
        },
        arrayMax: {
          maxItems: 1,
          type: 'array',
          'x-zui': {},
        },
        arrayMin: {
          minItems: 1,
          type: 'array',
          'x-zui': {},
        },
        arrayMinMax: {
          maxItems: 1,
          minItems: 1,
          type: 'array',
          'x-zui': {},
        },
        bigInt: {
          format: 'int64',
          type: 'integer',
          'x-zui': {},
        },
        boolean: {
          type: 'boolean',
          'x-zui': {},
        },
        date: {
          format: 'date-time',
          type: 'string',
          'x-zui': {},
        },
        default: {
          default: 42,
          'x-zui': {},
        },
        effectPreprocess: {
          type: 'string',
          'x-zui': {},
        },
        effectRefine: {
          type: 'string',
          'x-zui': {},
        },
        effectTransform: {
          type: 'string',
          'x-zui': {},
        },
        enum: {
          enum: ['hej', 'svejs'],
          type: 'string',
          'x-zui': {},
        },
        intersection: {
          allOf: [
            {
              minLength: 1,
              type: 'string',
              'x-zui': {},
            },
            {
              maxLength: 4,
              type: 'string',
              'x-zui': {},
            },
          ],
          'x-zui': {},
        },
        literal: {
          enum: ['hej'],
          type: 'string',
          'x-zui': {},
        },
        map: {
          items: {
            items: [
              {
                format: 'uuid',
                type: 'string',
                'x-zui': {},
              },
              {
                type: 'boolean',
                'x-zui': {},
              },
            ],
            maxItems: 2,
            minItems: 2,
            type: 'array',
          },
          maxItems: 125,
          type: 'array',
          'x-zui': {},
        },
        nativeEnum: {
          enum: [0, 1, 2],
          type: 'number',
          'x-zui': {},
        },
        never: {
          not: {},
          'x-zui': {},
        },
        null: {
          enum: ['null'],
          nullable: true,
          'x-zui': {},
        },
        nullable: {
          additionalProperties: false,
          nullable: true,
          properties: {
            hello: {
              type: 'string',
              'x-zui': {},
            },
          },
          required: ['hello'],
          type: 'object',
          'x-zui': {},
        },
        nullablePrimitive: {
          nullable: true,
          type: 'string',
          'x-zui': {},
        },
        number: {
          type: 'number',
          'x-zui': {},
        },
        numberGt: {
          exclusiveMinimum: true,
          minimum: 1,
          type: 'number',
          'x-zui': {},
        },
        numberGtLt: {
          exclusiveMaximum: true,
          exclusiveMinimum: true,
          maximum: 1,
          minimum: 1,
          type: 'number',
          'x-zui': {},
        },
        numberGte: {
          minimum: 1,
          type: 'number',
          'x-zui': {},
        },
        numberGteLte: {
          maximum: 1,
          minimum: 1,
          type: 'number',
          'x-zui': {},
        },
        numberInt: {
          type: 'integer',
          'x-zui': {},
        },
        numberLt: {
          exclusiveMaximum: true,
          maximum: 1,
          type: 'number',
          'x-zui': {},
        },
        numberLte: {
          maximum: 1,
          type: 'number',
          'x-zui': {},
        },
        numberMultipleOf: {
          multipleOf: 2,
          type: 'number',
          'x-zui': {},
        },
        objectCatchall: {
          additionalProperties: {
            type: 'boolean',
            'x-zui': {},
          },
          properties: {
            bar: {
              type: 'number',
              'x-zui': {},
            },
            foo: {
              type: 'string',
              'x-zui': {},
            },
          },
          required: ['foo'],
          type: 'object',
          'x-zui': {},
        },
        objectPasstrough: {
          additionalProperties: true,
          properties: {
            bar: {
              type: 'number',
              'x-zui': {},
            },
            foo: {
              type: 'string',
              'x-zui': {},
            },
          },
          required: ['foo'],
          type: 'object',
          'x-zui': {},
        },
        objectStrict: {
          additionalProperties: false,
          properties: {
            bar: {
              type: 'number',
              'x-zui': {},
            },
            foo: {
              type: 'string',
              'x-zui': {},
            },
          },
          required: ['foo'],
          type: 'object',
          'x-zui': {},
        },
        objectStrip: {
          additionalProperties: false,
          properties: {
            bar: {
              type: 'number',
              'x-zui': {},
            },
            foo: {
              type: 'string',
              'x-zui': {},
            },
          },
          required: ['foo'],
          type: 'object',
          'x-zui': {},
        },
        promise: {
          type: 'string',
          'x-zui': {},
        },
        recordBooleanBoolean: {
          additionalProperties: {
            type: 'boolean',
            'x-zui': {},
          },
          type: 'object',
          'x-zui': {},
        },
        recordStringBoolean: {
          additionalProperties: {
            type: 'boolean',
            'x-zui': {},
          },
          type: 'object',
          'x-zui': {},
        },
        recordUuidBoolean: {
          additionalProperties: {
            type: 'boolean',
            'x-zui': {},
          },
          type: 'object',
          'x-zui': {},
        },
        set: {
          items: {
            type: 'string',
            'x-zui': {},
          },
          type: 'array',
          uniqueItems: true,
          'x-zui': {},
        },
        string: {
          type: 'string',
          'x-zui': {},
        },
        stringCuid: {
          pattern: '^[cC][^\\s-]{8,}$',
          type: 'string',
          'x-zui': {},
        },
        stringEmail: {
          format: 'email',
          type: 'string',
          'x-zui': {},
        },
        stringMax: {
          maxLength: 1,
          type: 'string',
          'x-zui': {},
        },
        stringMin: {
          minLength: 1,
          type: 'string',
          'x-zui': {},
        },
        stringRegEx: {
          pattern: 'abc',
          type: 'string',
          'x-zui': {},
        },
        stringUrl: {
          format: 'uri',
          type: 'string',
          'x-zui': {},
        },
        stringUuid: {
          format: 'uuid',
          type: 'string',
          'x-zui': {},
        },
        tuple: {
          items: [
            {
              type: 'string',
              'x-zui': {},
            },
            {
              type: 'number',
              'x-zui': {},
            },
            {
              type: 'boolean',
              'x-zui': {},
            },
          ],
          maxItems: 3,
          minItems: 3,
          type: 'array',
          'x-zui': {},
        },
        undefined: {
          not: {},
          'x-zui': {},
        },
        unionNonPrimitives: {
          anyOf: [
            {
              type: 'string',
              'x-zui': {},
            },
            {
              additionalProperties: false,
              properties: {
                bar: {
                  type: 'number',
                  'x-zui': {},
                },
                foo: {
                  type: 'string',
                  'x-zui': {},
                },
              },
              required: ['foo'],
              type: 'object',
              'x-zui': {},
            },
          ],
          'x-zui': {},
        },
        unionPrimitiveLiterals: {
          anyOf: [
            {
              enum: [123],
              type: 'number',
              'x-zui': {},
            },
            {
              enum: ['abc'],
              type: 'string',
              'x-zui': {},
            },
            {
              type: 'object',
              'x-zui': {},
            },
            {
              enum: [true],
              type: 'boolean',
              'x-zui': {},
            },
          ],
          'x-zui': {},
        },
        unionPrimitives: {
          anyOf: [
            {
              type: 'string',
              'x-zui': {},
            },
            {
              type: 'number',
              'x-zui': {},
            },
            {
              type: 'boolean',
              'x-zui': {},
            },
            {
              format: 'int64',
              type: 'integer',
              'x-zui': {},
            },
            {
              enum: ['null'],
              nullable: true,
              'x-zui': {},
            },
          ],
          'x-zui': {},
        },
        unknown: {
          'x-zui': {},
        },
      },
      type: 'object',
      'x-zui': {},
    }

    expect(jsonSchema).toEqual(expectedOutput)
  })
})
