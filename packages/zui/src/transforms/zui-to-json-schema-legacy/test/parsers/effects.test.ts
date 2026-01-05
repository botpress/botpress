import { describe, it, expect } from 'vitest'
import { JSONSchema7Type } from 'json-schema'
import { z } from '../../../../z/index'
import { parseEffectsDef } from '../../parsers/effects'
import { getRefs } from '../../Refs'
import { zuiKey } from '../../../../ui/constants'

describe('effects', () => {
  it('should be possible to use refine', () => {
    const parsedSchema = parseEffectsDef(z.number().refine((x) => x + 1)._def, getRefs())
    const jsonSchema: JSONSchema7Type = {
      type: 'number',
      [zuiKey]: {},
    }
    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('should default to the input type', () => {
    const schema = z.string().transform((arg) => parseInt(arg))

    const jsonSchema = parseEffectsDef(schema._def, getRefs())

    expect(jsonSchema).toEqual({ type: 'string', [zuiKey]: {} })
  })
})
