import { describe, it, expect } from 'vitest'
import { zuiKey } from '../../../../ui/constants'
import { z } from '../../../../z/index'
import { parseObjectDef } from '../../parsers/object'
import { getRefs } from '../../Refs'

describe('nullable', () => {
  it('should be possible to properly reference nested nullable primitives', () => {
    const nullablePrimitive = z.string().nullable()

    const schema = z.object({
      one: nullablePrimitive,
      two: nullablePrimitive,
    })

    const jsonSchema: any = parseObjectDef(schema._def, getRefs())

    expect(jsonSchema.properties.one.type).toEqual(['string', 'null'])
    expect(jsonSchema.properties.two.$ref).toEqual('#/properties/one')
  })

  it('should be possible to properly reference nested nullable primitives', () => {
    const three = z.string()

    const nullableObject = z
      .object({
        three,
      })
      .nullable()

    const schema = z.object({
      one: nullableObject,
      two: nullableObject,
      three,
    })

    const jsonSchema: any = parseObjectDef(schema._def, getRefs())

    expect(jsonSchema.properties.one).toEqual({
      anyOf: [
        {
          type: 'object',
          additionalProperties: false,
          required: ['three'],
          properties: {
            three: {
              type: 'string',
              [zuiKey]: {},
            },
          },
          [zuiKey]: {},
        },
        {
          type: 'null',
        },
      ],
      [zuiKey]: {},
    })

    expect(jsonSchema.properties.two.$ref).toEqual('#/properties/one')
    expect(jsonSchema.properties.three.$ref).toEqual('#/properties/one/anyOf/0/properties/three')
  })
})
