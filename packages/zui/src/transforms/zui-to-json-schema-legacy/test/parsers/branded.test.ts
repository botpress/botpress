import { describe, it, expect } from 'vitest'
import { zuiKey } from '../../../../ui/constants'
import { z } from '../../../../z/index'
import { parseBrandedDef } from '../../parsers/branded'
import { getRefs } from '../../Refs'

describe('objects', () => {
  it('should be possible to use branded string', () => {
    const schema = z.string().brand<'x'>()
    const parsedSchema = parseBrandedDef(schema._def, getRefs())

    const expectedSchema = {
      type: 'string',
      [zuiKey]: {},
    }

    expect(parsedSchema).toEqual(expectedSchema)
  })
})
