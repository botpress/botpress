import { describe, it, expect } from 'vitest'
import * as z from '../../../../z'
import { parseBrandedDef } from '../../parsers/branded'
import { getRefs } from '../../Refs'

const { zuiKey } = z

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
