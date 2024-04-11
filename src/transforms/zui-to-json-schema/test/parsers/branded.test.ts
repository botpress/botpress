import { z } from '../../../../z'
import { parseBrandedDef } from '../../parsers/branded'
import { getRefs } from '../../Refs'

describe('objects', () => {
  it('should be possible to use branded string', () => {
    const schema = z.string().brand<'x'>()
    const parsedSchema = parseBrandedDef(schema._def, getRefs())

    const expectedSchema = {
      type: 'string',
    }

    expect(parsedSchema).toEqual(expectedSchema)
  })
})
