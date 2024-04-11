import { z } from '../../../../z'
import { parseTupleDef } from '../../parsers/tuple'
import { getRefs } from '../../Refs'

describe('objects', () => {
  it('should be possible to describe a simple tuple schema', () => {
    const schema = z.tuple([z.string(), z.number()])

    const parsedSchema = parseTupleDef(schema._def, getRefs())
    const expectedSchema = {
      type: 'array',
      items: [{ type: 'string' }, { type: 'number' }],
      minItems: 2,
      maxItems: 2,
    }
    expect(parsedSchema).toEqual(expectedSchema)
  })

  it('should be possible to describe a tuple schema with rest()', () => {
    const schema = z.tuple([z.string(), z.number()]).rest(z.boolean())

    const parsedSchema = parseTupleDef(schema._def, getRefs())
    const expectedSchema = {
      type: 'array',
      items: [{ type: 'string' }, { type: 'number' }],
      minItems: 2,
      additionalItems: {
        type: 'boolean',
      },
    }
    expect(parsedSchema).toEqual(expectedSchema)
  })
})
