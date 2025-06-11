import { describe, it, expect } from 'vitest'
import { JSONSchema7Type } from 'json-schema'
import { parseBigintDef } from '../../parsers/bigint'
import { z } from '../../../../z/index'
import { getRefs } from '../../Refs'

describe('bigint', () => {
  it('should be possible to use bigint', () => {
    const parsedSchema = parseBigintDef(z.bigint()._def, getRefs())
    const jsonSchema: JSONSchema7Type = {
      type: 'integer',
      format: 'int64',
    }
    expect(parsedSchema).toEqual(jsonSchema)
  })

  // Jest doesn't like bigints. 🤷
  it('should be possible to define gt/lt', () => {
    const parsedSchema = parseBigintDef(z.bigint().gte(BigInt(10)).lte(BigInt(20))._def, getRefs())
    const jsonSchema = {
      type: 'integer',
      format: 'int64',
      minimum: BigInt(10),
      maximum: BigInt(20),
    }
    expect(parsedSchema).toEqual(jsonSchema)
  })
})
