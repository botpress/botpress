import { z } from '../../../../z'
import { parseObjectDef } from '../../parsers/object'
import { getRefs } from '../../Refs'

describe('objects', () => {
  it('should be possible to describe catchAll schema', () => {
    const schema = z.object({ normalProperty: z.string() }).catchall(z.boolean())

    const parsedSchema = parseObjectDef(schema._def, getRefs())
    const expectedSchema = {
      type: 'object',
      properties: {
        normalProperty: { type: 'string' },
      },
      required: ['normalProperty'],
      additionalProperties: {
        type: 'boolean',
      },
    }
    expect(parsedSchema).toEqual(expectedSchema)
  })

  it('should be possible to use selective partial', () => {
    const schema = z.object({ foo: z.boolean(), bar: z.number() }).partial({ foo: true })

    const parsedSchema = parseObjectDef(schema._def, getRefs())
    const expectedSchema = {
      type: 'object',
      properties: {
        foo: { type: 'boolean' },
        bar: { type: 'number' },
      },
      required: ['bar'],
      additionalProperties: false,
    }
    expect(parsedSchema).toEqual(expectedSchema)
  })
})
