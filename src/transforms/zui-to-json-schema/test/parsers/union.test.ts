import { JSONSchema7Type } from 'json-schema'
import { z } from 'zod'
import { parseUnionDef } from '../../parsers/union'
import { getRefs } from '../../Refs'
import deref from 'local-ref-resolver'

describe('Unions', () => {
  it('Should be possible to get a simple type array from a union of only unvalidated primitives', () => {
    const parsedSchema = parseUnionDef(z.union([z.string(), z.number(), z.boolean(), z.null()])._def, getRefs())
    const jsonSchema: JSONSchema7Type = {
      type: ['string', 'number', 'boolean', 'null'],
    }

    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('Should be possible to get a simple type array with enum values from a union of literals', () => {
    const parsedSchema = parseUnionDef(
      z.union([z.literal('string'), z.literal(123), z.literal(true), z.literal(null)])._def,
      getRefs(),
    )
    const jsonSchema: JSONSchema7Type = {
      type: ['string', 'number', 'boolean', 'null'],
      enum: ['string', 123, true, null],
    }
    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('Should be possible to create a union with objects, arrays and validated primitives as an anyOf', () => {
    const parsedSchema = parseUnionDef(
      z.union([z.object({ herp: z.string(), derp: z.boolean() }), z.array(z.number()), z.string().min(3), z.number()])
        ._def,
      getRefs(),
    )
    const jsonSchema: JSONSchema7Type = {
      anyOf: [
        {
          type: 'object',
          properties: {
            herp: {
              type: 'string',
            },
            derp: {
              type: 'boolean',
            },
          },
          required: ['herp', 'derp'],
          additionalProperties: false,
        },
        {
          type: 'array',
          items: {
            type: 'number',
          },
        },
        {
          type: 'string',
          minLength: 3,
        },
        {
          type: 'number',
        },
      ],
    }
    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('should be possible to deref union schemas', () => {
    const recurring = z.object({ foo: z.boolean() })

    const union = z.union([recurring, recurring, recurring])

    const jsonSchema = parseUnionDef(union._def, getRefs())

    expect(jsonSchema).toEqual({
      anyOf: [
        {
          type: 'object',
          properties: {
            foo: {
              type: 'boolean',
            },
          },
          required: ['foo'],
          additionalProperties: false,
        },
        {
          $ref: '#/anyOf/0',
        },
        {
          $ref: '#/anyOf/0',
        },
      ],
    })

    const resolvedSchema = deref(jsonSchema)
    expect(resolvedSchema.anyOf[0]).toEqual(resolvedSchema.anyOf[1])
    expect(resolvedSchema.anyOf[1]).toEqual(resolvedSchema.anyOf[2])
  })

  it('nullable primitives should come out fine', () => {
    const union = z.union([z.string(), z.null()])

    const jsonSchema = parseUnionDef(union._def, getRefs())

    expect(jsonSchema).toEqual({
      type: ['string', 'null'],
    })
  })

  it('should join a union of Zod enums into a single enum', () => {
    const union = z.union([z.enum(['a', 'b', 'c']), z.enum(['c', 'd', 'e'])])

    const jsonSchema = parseUnionDef(union._def, getRefs())

    expect(jsonSchema).toEqual({
      type: 'string',
      enum: ['a', 'b', 'c', 'd', 'e'],
    })
  })

  it('should work with discriminated union type', () => {
    const discUnion = z.discriminatedUnion('kek', [
      z.object({ kek: z.literal('A'), lel: z.boolean() }),
      z.object({ kek: z.literal('B'), lel: z.number() }),
    ])

    const jsonSchema = parseUnionDef(discUnion._def, getRefs())

    expect(jsonSchema).toEqual({
      anyOf: [
        {
          type: 'object',
          properties: {
            kek: {
              type: 'string',
              const: 'A',
            },
            lel: {
              type: 'boolean',
            },
          },
          required: ['kek', 'lel'],
          additionalProperties: false,
        },
        {
          type: 'object',
          properties: {
            kek: {
              type: 'string',
              const: 'B',
            },
            lel: {
              type: 'number',
            },
          },
          required: ['kek', 'lel'],
          additionalProperties: false,
        },
      ],
    })
  })

  it('should work with discriminated union type, discriminator and oneOf', () => {
    const discUnion = z.discriminatedUnion('kek', [
      z.object({ kek: z.literal('A'), lel: z.boolean() }),
      z.object({ kek: z.literal('B'), lel: z.number() }),
    ])

    const jsonSchema = parseUnionDef(
      discUnion._def,
      getRefs({
        unionStrategy: 'oneOf',
        discriminator: true,
      }),
    )

    expect(jsonSchema).toEqual({
      oneOf: [
        {
          type: 'object',
          properties: {
            kek: {
              type: 'string',
              const: 'A',
            },
            lel: {
              type: 'boolean',
            },
          },
          required: ['kek', 'lel'],
          additionalProperties: false,
        },
        {
          type: 'object',
          properties: {
            kek: {
              type: 'string',
              const: 'B',
            },
            lel: {
              type: 'number',
            },
          },
          required: ['kek', 'lel'],
          additionalProperties: false,
        },
      ],
      discriminator: {
        propertyName: 'kek',
      },
    })
  })

  it('should not ignore descriptions in literal unions', () => {
    expect([
      parseUnionDef(z.union([z.literal(true), z.literal('herp'), z.literal(3)])._def, getRefs()),
      parseUnionDef(z.union([z.literal(true), z.literal('herp').describe('derp'), z.literal(3)])._def, getRefs()),
    ]).toEqual([
      { type: ['boolean', 'string', 'number'], enum: [true, 'herp', 3] },
      {
        anyOf: [
          { type: 'boolean', const: true },
          { type: 'string', const: 'herp', description: 'derp' },
          { type: 'number', const: 3 },
        ],
      },
    ])
  })
})
