import { describe, it, expect } from 'vitest'
import { zuiKey } from '../../../../ui/constants'
import { z } from '../../../../z/index'
import { parseRecordDef } from '../../parsers/record'
import { getRefs } from '../../Refs'

describe('records', () => {
  it('should be possible to describe a simple record', () => {
    const schema = z.record(z.number())

    const parsedSchema = parseRecordDef(schema._def, getRefs())
    const expectedSchema = {
      type: 'object',
      additionalProperties: {
        type: 'number',
        [zuiKey]: {},
      },
    }

    expect(parsedSchema).toEqual(expectedSchema)
  })

  it('should be possible to describe a complex record with checks', () => {
    const schema = z.record(z.object({ foo: z.number().min(2) }).catchall(z.string().cuid()))

    const parsedSchema = parseRecordDef(schema._def, getRefs())
    const expectedSchema = {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          foo: {
            type: 'number',
            [zuiKey]: {},
            minimum: 2,
          },
        },
        required: ['foo'],
        additionalProperties: {
          type: 'string',
          [zuiKey]: {},
          pattern: '^[cC][^\\s-]{8,}$',
        },
        [zuiKey]: {},
      },
    }

    expect(parsedSchema).toEqual(expectedSchema)
  })

  it('should be possible to describe a key schema', () => {
    const schema = z.record(z.string().uuid(), z.number())

    const parsedSchema = parseRecordDef(schema._def, getRefs())
    const expectedSchema = {
      type: 'object',
      additionalProperties: {
        type: 'number',
        [zuiKey]: {},
      },
      propertyNames: {
        format: 'uuid',
      },
    }
    expect(parsedSchema).toEqual(expectedSchema)
  })

  it('should be possible to describe a key with an enum', () => {
    const schema = z.record(z.enum(['foo', 'bar']), z.number())
    const parsedSchema = parseRecordDef(schema._def, getRefs())
    const expectedSchema = {
      type: 'object',
      additionalProperties: {
        type: 'number',
        [zuiKey]: {},
      },
      propertyNames: {
        enum: ['foo', 'bar'],
      },
    }

    expect(parsedSchema).toEqual(expectedSchema)
  })
})
