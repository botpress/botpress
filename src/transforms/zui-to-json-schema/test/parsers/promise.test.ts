import { JSONSchema7Type } from 'json-schema'
import { z } from '../../../../z'
import { parsePromiseDef } from '../../parsers/promise'
import { getRefs } from '../../Refs'

describe('promise', () => {
  it('should be possible to use promise', () => {
    const parsedSchema = parsePromiseDef(z.promise(z.string())._def, getRefs())
    const jsonSchema: JSONSchema7Type = {
      type: 'string',
    }
    expect(parsedSchema).toEqual(jsonSchema)
  })
})
