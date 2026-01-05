import { describe, it, expect } from 'vitest'
import { JSONSchema7Type } from 'json-schema'
import { z } from '../../../../z/index'
import { parseMapDef } from '../../parsers/map'
import Ajv from 'ajv'
import { getRefs } from '../../Refs'
import { zuiKey } from '../../../../ui/constants'

const ajv = new Ajv({ strict: false })
describe('map', () => {
  it('should be possible to use Map', () => {
    const mapSchema = z.map(z.string(), z.number())

    const parsedSchema = parseMapDef(mapSchema._def, getRefs())

    const jsonSchema: JSONSchema7Type = {
      type: 'array',
      maxItems: 125,
      items: {
        type: 'array',
        items: [
          {
            type: 'string',
            [zuiKey]: {},
          },
          {
            type: 'number',
            [zuiKey]: {},
          },
        ],
        minItems: 2,
        maxItems: 2,
      },
    }

    expect(parsedSchema).toEqual(jsonSchema)

    const myMap: z.infer<typeof mapSchema> = new Map<string, number>()
    myMap.set('hello', 123)

    ajv.validate(jsonSchema, [...myMap])
    const ajvResult = !ajv.errors

    const zodResult = mapSchema.safeParse(myMap).success

    expect(zodResult).toBeTruthy()
    expect(ajvResult).toBeTruthy()
  })

  it('should be possible to use additionalProperties-pattern (record)', () => {
    expect(parseMapDef(z.map(z.string().min(1), z.number())._def, getRefs({ mapStrategy: 'record' }))).toEqual({
      type: 'object',
      additionalProperties: {
        type: 'number',
        [zuiKey]: {},
      },
      propertyNames: {
        minLength: 1,
      },
    })
  })
})
