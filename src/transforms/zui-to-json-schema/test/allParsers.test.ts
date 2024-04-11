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
    nullableObject: z.object({ hello: z.string() }).nullable(),
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
      type: 'object',
      properties: {
        any: {},
        array: {
          type: 'array',
        },
        arrayMin: {
          type: 'array',
          minItems: 1,
        },
        arrayMax: {
          type: 'array',
          maxItems: 1,
        },
        arrayMinMax: {
          type: 'array',
          minItems: 1,
          maxItems: 1,
        },
        bigInt: {
          type: 'integer',
          format: 'int64',
        },
        boolean: {
          type: 'boolean',
        },
        date: {
          type: 'string',
          format: 'date-time',
        },
        default: {
          default: 42,
        },
        effectRefine: {
          type: 'string',
        },
        effectTransform: {
          type: 'string',
        },
        effectPreprocess: {
          type: 'string',
        },
        enum: {
          type: 'string',
          enum: ['hej', 'svejs'],
        },
        intersection: {
          allOf: [
            {
              type: 'string',
              minLength: 1,
            },
            {
              type: 'string',
              maxLength: 4,
            },
          ],
        },
        literal: {
          type: 'string',
          const: 'hej',
        },
        map: {
          type: 'array',
          maxItems: 125,
          items: {
            type: 'array',
            items: [
              {
                type: 'string',
                format: 'uuid',
              },
              {
                type: 'boolean',
              },
            ],
            minItems: 2,
            maxItems: 2,
          },
        },
        nativeEnum: {
          type: 'number',
          enum: [0, 1, 2],
        },
        never: {
          not: {},
        },
        null: {
          type: 'null',
        },
        nullablePrimitive: {
          type: ['string', 'null'],
        },
        nullableObject: {
          anyOf: [
            {
              type: 'object',
              properties: {
                hello: {
                  type: 'string',
                },
              },
              required: ['hello'],
              additionalProperties: false,
            },
            {
              type: 'null',
            },
          ],
        },
        number: {
          type: 'number',
        },
        numberGt: {
          type: 'number',
          exclusiveMinimum: 1,
        },
        numberLt: {
          type: 'number',
          exclusiveMaximum: 1,
        },
        numberGtLt: {
          type: 'number',
          exclusiveMinimum: 1,
          exclusiveMaximum: 1,
        },
        numberGte: {
          type: 'number',
          minimum: 1,
        },
        numberLte: {
          type: 'number',
          maximum: 1,
        },
        numberGteLte: {
          type: 'number',
          minimum: 1,
          maximum: 1,
        },
        numberMultipleOf: {
          type: 'number',
          multipleOf: 2,
        },
        numberInt: {
          type: 'integer',
        },
        objectPasstrough: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
            bar: {
              type: 'number',
            },
          },
          required: ['foo'],
          additionalProperties: true,
        },
        objectCatchall: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
            bar: {
              type: 'number',
            },
          },
          required: ['foo'],
          additionalProperties: {
            type: 'boolean',
          },
        },
        objectStrict: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
            bar: {
              type: 'number',
            },
          },
          required: ['foo'],
          additionalProperties: false,
        },
        objectStrip: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
            bar: {
              type: 'number',
            },
          },
          required: ['foo'],
          additionalProperties: false,
        },
        promise: {
          type: 'string',
        },
        recordStringBoolean: {
          type: 'object',
          additionalProperties: {
            type: 'boolean',
          },
        },
        recordUuidBoolean: {
          type: 'object',
          additionalProperties: {
            type: 'boolean',
          },
          propertyNames: {
            format: 'uuid',
          },
        },
        recordBooleanBoolean: {
          type: 'object',
          additionalProperties: {
            type: 'boolean',
          },
        },
        set: {
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string',
          },
        },
        string: {
          type: 'string',
        },
        stringMin: {
          type: 'string',
          minLength: 1,
        },
        stringMax: {
          type: 'string',
          maxLength: 1,
        },
        stringEmail: {
          type: 'string',
          format: 'email',
        },
        stringUrl: {
          type: 'string',
          format: 'uri',
        },
        stringUuid: {
          type: 'string',
          format: 'uuid',
        },
        stringRegEx: {
          type: 'string',
          pattern: 'abc',
        },
        stringCuid: {
          type: 'string',
          pattern: '^[cC][^\\s-]{8,}$',
        },
        tuple: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
            {
              type: 'boolean',
            },
          ],
        },
        undefined: {
          not: {},
        },
        unionPrimitives: {
          type: ['string', 'number', 'boolean', 'integer', 'null'],
        },
        unionPrimitiveLiterals: {
          type: ['number', 'string', 'null', 'boolean'],
          enum: [123, 'abc', null, true],
        },
        unionNonPrimitives: {
          anyOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              properties: {
                foo: {
                  type: 'string',
                },
                bar: {
                  type: 'number',
                },
              },
              required: ['foo'],
              additionalProperties: false,
            },
          ],
        },
        unknown: {},
      },
      additionalProperties: false,
      default: {
        string: 'hello',
      },
      description: 'watup',
    }

    expect(jsonSchema).toEqual(expectedOutput)
  })

  it('With OpenAPI schema target, should produce valid Open API schema', () => {
    const jsonSchema = zodToJsonSchema(allParsersSchema, {
      target: 'openApi3',
    })
    const expectedOutput = {
      type: 'object',
      properties: {
        any: {},
        array: {
          type: 'array',
        },
        arrayMin: {
          type: 'array',
          minItems: 1,
        },
        arrayMax: {
          type: 'array',
          maxItems: 1,
        },
        arrayMinMax: {
          type: 'array',
          minItems: 1,
          maxItems: 1,
        },
        bigInt: {
          type: 'integer',
          format: 'int64',
        },
        boolean: {
          type: 'boolean',
        },
        date: {
          type: 'string',
          format: 'date-time',
        },
        default: {
          default: 42,
        },
        effectRefine: {
          type: 'string',
        },
        effectTransform: {
          type: 'string',
        },
        effectPreprocess: {
          type: 'string',
        },
        enum: {
          type: 'string',
          enum: ['hej', 'svejs'],
        },
        intersection: {
          allOf: [
            {
              type: 'string',
              minLength: 1,
            },
            {
              type: 'string',
              maxLength: 4,
            },
          ],
        },
        literal: {
          type: 'string',
          enum: ['hej'],
        },
        map: {
          type: 'array',
          maxItems: 125,
          items: {
            type: 'array',
            items: [
              {
                type: 'string',
                format: 'uuid',
              },
              {
                type: 'boolean',
              },
            ],
            minItems: 2,
            maxItems: 2,
          },
        },
        nativeEnum: {
          type: 'number',
          enum: [0, 1, 2],
        },
        never: {
          not: {},
        },
        null: {
          enum: ['null'],
          nullable: true,
        },
        nullablePrimitive: {
          type: 'string',
          nullable: true,
        },
        nullableObject: {
          type: 'object',
          properties: {
            hello: {
              type: 'string',
            },
          },
          required: ['hello'],
          additionalProperties: false,
          nullable: true,
        },
        number: {
          type: 'number',
        },
        numberGt: {
          type: 'number',
          exclusiveMinimum: true,
          minimum: 1,
        },
        numberLt: {
          type: 'number',
          exclusiveMaximum: true,
          maximum: 1,
        },
        numberGtLt: {
          type: 'number',
          exclusiveMinimum: true,
          minimum: 1,
          exclusiveMaximum: true,
          maximum: 1,
        },
        numberGte: {
          type: 'number',
          minimum: 1,
        },
        numberLte: {
          type: 'number',
          maximum: 1,
        },
        numberGteLte: {
          type: 'number',
          minimum: 1,
          maximum: 1,
        },
        numberMultipleOf: {
          type: 'number',
          multipleOf: 2,
        },
        numberInt: {
          type: 'integer',
        },
        objectPasstrough: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
            bar: {
              type: 'number',
            },
          },
          required: ['foo'],
          additionalProperties: true,
        },
        objectCatchall: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
            bar: {
              type: 'number',
            },
          },
          required: ['foo'],
          additionalProperties: {
            type: 'boolean',
          },
        },
        objectStrict: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
            bar: {
              type: 'number',
            },
          },
          required: ['foo'],
          additionalProperties: false,
        },
        objectStrip: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
            bar: {
              type: 'number',
            },
          },
          required: ['foo'],
          additionalProperties: false,
        },
        promise: {
          type: 'string',
        },
        recordStringBoolean: {
          type: 'object',
          additionalProperties: {
            type: 'boolean',
          },
        },
        recordUuidBoolean: {
          type: 'object',
          additionalProperties: {
            type: 'boolean',
          },
        },
        recordBooleanBoolean: {
          type: 'object',
          additionalProperties: {
            type: 'boolean',
          },
        },
        set: {
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string',
          },
        },
        string: {
          type: 'string',
        },
        stringMin: {
          type: 'string',
          minLength: 1,
        },
        stringMax: {
          type: 'string',
          maxLength: 1,
        },
        stringEmail: {
          type: 'string',
          format: 'email',
        },
        stringUrl: {
          type: 'string',
          format: 'uri',
        },
        stringUuid: {
          type: 'string',
          format: 'uuid',
        },
        stringRegEx: {
          type: 'string',
          pattern: 'abc',
        },
        stringCuid: {
          type: 'string',
          pattern: '^[cC][^\\s-]{8,}$',
        },
        tuple: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
            {
              type: 'boolean',
            },
          ],
        },
        undefined: {
          not: {},
        },
        unionPrimitives: {
          anyOf: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
            {
              type: 'boolean',
            },
            {
              type: 'integer',
              format: 'int64',
            },
            {
              enum: ['null'],
              nullable: true,
            },
          ],
        },
        unionPrimitiveLiterals: {
          anyOf: [
            {
              type: 'number',
              enum: [123],
            },
            {
              type: 'string',
              enum: ['abc'],
            },
            {
              type: 'object',
            },
            {
              type: 'boolean',
              enum: [true],
            },
          ],
        },
        unionNonPrimitives: {
          anyOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              properties: {
                foo: {
                  type: 'string',
                },
                bar: {
                  type: 'number',
                },
              },
              required: ['foo'],
              additionalProperties: false,
            },
          ],
        },
        unknown: {},
      },
      additionalProperties: false,
      default: {
        string: 'hello',
      },
      description: 'watup',
    }

    expect(jsonSchema).toEqual(expectedOutput)
  })
})
