import { describe, it, expect } from 'vitest'
import { JSONSchema7Type } from 'json-schema'
import { z } from '../../../../z/index'
import { parseDef } from '../../parseDef'
import { getRefs } from '../../Refs'
import { zuiKey } from '../../../../ui/constants'

describe('Standalone optionals', () => {
  it('should work as unions with undefined', () => {
    const parsedSchema = parseDef(z.string().optional()._def, getRefs())

    const jsonSchema: JSONSchema7Type = {
      anyOf: [
        {
          not: {},
        },
        {
          type: 'string',
          [zuiKey]: {},
        },
      ],
      [zuiKey]: {},
    }

    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('should not affect object properties', () => {
    const parsedSchema = parseDef(z.object({ myProperty: z.string().optional() })._def, getRefs())

    const jsonSchema: JSONSchema7Type = {
      type: 'object',
      properties: {
        myProperty: {
          type: 'string',
          [zuiKey]: {},
        },
      },
      additionalProperties: false,
      [zuiKey]: {},
    }

    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('should work with nested properties', () => {
    const parsedSchema = parseDef(z.object({ myProperty: z.string().optional().array() })._def, getRefs())

    const jsonSchema: JSONSchema7Type = {
      type: 'object',
      properties: {
        myProperty: {
          type: 'array',
          items: {
            anyOf: [{ not: {} }, { type: 'string', [zuiKey]: {} }],
            [zuiKey]: {},
          },
          [zuiKey]: {},
        },
      },
      required: ['myProperty'],
      additionalProperties: false,
      [zuiKey]: {},
    }

    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('should work with nested properties as object properties', () => {
    const parsedSchema = parseDef(
      z.object({
        myProperty: z.object({ myInnerProperty: z.string().optional() }),
      })._def,
      getRefs(),
    )

    const jsonSchema: JSONSchema7Type = {
      type: 'object',
      properties: {
        myProperty: {
          type: 'object',
          properties: {
            myInnerProperty: {
              type: 'string',
              [zuiKey]: {},
            },
          },
          additionalProperties: false,
          [zuiKey]: {},
        },
      },
      required: ['myProperty'],
      additionalProperties: false,
      [zuiKey]: {},
    }

    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('should work with nested properties with nested object property parents', () => {
    const parsedSchema = parseDef(
      z.object({
        myProperty: z.object({
          myInnerProperty: z.string().optional().array(),
        }),
      })._def,
      getRefs(),
    )

    const jsonSchema: JSONSchema7Type = {
      type: 'object',
      properties: {
        myProperty: {
          type: 'object',
          properties: {
            myInnerProperty: {
              type: 'array',
              items: {
                anyOf: [
                  { not: {} },
                  {
                    type: 'string',
                    [zuiKey]: {},
                  },
                ],
                [zuiKey]: {},
              },
              [zuiKey]: {},
            },
          },
          required: ['myInnerProperty'],
          additionalProperties: false,
          [zuiKey]: {},
        },
      },
      required: ['myProperty'],
      additionalProperties: false,
      [zuiKey]: {},
    }

    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('should work with ref pathing', () => {
    const recurring = z.string()

    const schema = z.tuple([recurring.optional(), recurring])

    const parsedSchema = parseDef(schema._def, getRefs())

    const jsonSchema: JSONSchema7Type = {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      items: [{ anyOf: [{ not: {} }, { type: 'string', [zuiKey]: {} }], [zuiKey]: {} }, { $ref: '#/items/0/anyOf/1' }],
      [zuiKey]: {},
    }

    expect(parsedSchema).toEqual(jsonSchema)
  })
})
