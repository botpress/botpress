import { JSONSchema7Type } from 'json-schema'
import { z } from '../../../z/index'
import { parseDef } from '../parseDef'
import Ajv from 'ajv'
import { getRefs } from '../Refs'

const ajv = new Ajv()

describe('Basic parsing', () => {
  it('should return a proper json schema with some common types without validation', () => {
    const zodSchema = z.object({
      requiredString: z.string(),
      optionalString: z.string().optional(),
      literalString: z.literal('literalStringValue'),
      stringArray: z.array(z.string()),
      stringEnum: z.enum(['stringEnumOptionA', 'stringEnumOptionB']),
      tuple: z.tuple([z.string(), z.number(), z.boolean()]),
      record: z.record(z.boolean()),
      requiredNumber: z.number(),
      optionalNumber: z.number().optional(),
      numberOrNull: z.number().nullable(),
      numberUnion: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      mixedUnion: z.union([z.literal('abc'), z.literal(123), z.object({ nowItGetsAnnoying: z.literal(true) })]),
      objectOrNull: z.object({ myString: z.string() }).nullable(),
      passthrough: z.object({ myString: z.string() }).passthrough(),
    })
    const expectedJsonSchema: JSONSchema7Type = {
      type: 'object',
      properties: {
        requiredString: {
          type: 'string',
        },
        optionalString: {
          type: 'string',
        },
        literalString: {
          type: 'string',
          const: 'literalStringValue',
        },
        stringArray: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        stringEnum: {
          type: 'string',
          enum: ['stringEnumOptionA', 'stringEnumOptionB'],
        },
        tuple: {
          type: 'array',
          minItems: 3,
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
          maxItems: 3,
        },
        record: {
          type: 'object',
          additionalProperties: {
            type: 'boolean',
          },
        },
        requiredNumber: {
          type: 'number',
        },
        optionalNumber: {
          type: 'number',
        },
        numberOrNull: {
          type: ['number', 'null'],
        },
        numberUnion: {
          type: 'number',
          enum: [1, 2, 3],
        },
        mixedUnion: {
          anyOf: [
            {
              type: 'string',
              const: 'abc',
            },
            {
              type: 'number',
              const: 123,
            },
            {
              type: 'object',
              properties: {
                nowItGetsAnnoying: {
                  type: 'boolean',
                  const: true,
                },
              },
              required: ['nowItGetsAnnoying'],
              additionalProperties: false,
            },
          ],
        },
        objectOrNull: {
          anyOf: [
            {
              type: 'object',
              properties: {
                myString: {
                  type: 'string',
                },
              },
              required: ['myString'],
              additionalProperties: false,
            },
            {
              type: 'null',
            },
          ],
        },
        passthrough: {
          type: 'object',
          properties: {
            myString: {
              type: 'string',
            },
          },
          required: ['myString'],
          additionalProperties: true,
        },
      },
      required: [
        'requiredString',
        'literalString',
        'stringArray',
        'stringEnum',
        'tuple',
        'record',
        'requiredNumber',
        'numberOrNull',
        'numberUnion',
        'mixedUnion',
        'objectOrNull',
        'passthrough',
      ],
      additionalProperties: false,
    }
    const parsedSchema = parseDef(zodSchema._def, getRefs())
    expect(parsedSchema).toEqual(expectedJsonSchema)
    expect(ajv.validateSchema(parsedSchema!)).toBeTruthy()
  })

  it('should handle a nullable string properly', () => {
    const shorthand = z.string().nullable()
    const union = z.union([z.string(), z.null()])

    const expected = { type: ['string', 'null'] }

    expect(parseDef(shorthand._def, getRefs())).toEqual(expected)
    expect(parseDef(union._def, getRefs())).toEqual(expected)
  })
})
