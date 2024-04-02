import { JSONSchema7Type } from 'json-schema'
import { z } from 'zod'
import { parseEffectsDef } from '../../parsers/effects'
import { getRefs } from '../../Refs'

describe('effects', () => {
  it('should be possible to use refine', () => {
    const parsedSchema = parseEffectsDef(z.number().refine((x) => x + 1)._def, getRefs())
    const jsonSchema: JSONSchema7Type = {
      type: 'number',
    }
    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('should default to the input type', () => {
    const schema = z.string().transform((arg) => parseInt(arg))

    const jsonSchema = parseEffectsDef(schema._def, getRefs())

    expect(jsonSchema).toEqual({ type: 'string' })
  })
})
