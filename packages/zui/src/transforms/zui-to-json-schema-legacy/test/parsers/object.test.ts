import { describe, it, expect } from 'vitest'
import { zuiKey } from '../../../../ui/constants'
import { z } from '../../../../z/index'
import { parseObjectDef } from '../../parsers/object'
import { getRefs } from '../../Refs'

describe('objects', () => {
  it('should be possible to describe catchAll schema', () => {
    const schema = z.object({ normalProperty: z.string() }).catchall(z.boolean())

    const parsedSchema = parseObjectDef(schema._def, getRefs())
    const expectedSchema = {
      type: 'object',
      properties: {
        normalProperty: { type: 'string', [zuiKey]: {} },
      },
      required: ['normalProperty'],
      additionalProperties: {
        type: 'boolean',
        [zuiKey]: {},
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
        foo: { type: 'boolean', [zuiKey]: {} },
        bar: { type: 'number', [zuiKey]: {} },
      },
      required: ['bar'],
      additionalProperties: false,
    }
    expect(parsedSchema).toEqual(expectedSchema)
  })
})
