import { JSONSchema7Type } from 'json-schema'
import { z } from '../../../../z/index'
import { parseDefaultDef } from '../../parsers/default'
import { getRefs } from '../../Refs'

describe('promise', () => {
  it('should be possible to use default on objects', () => {
    const parsedSchema = parseDefaultDef(z.object({ foo: z.boolean() }).default({ foo: true })._def, getRefs())
    const jsonSchema: JSONSchema7Type = {
      type: 'object',
      additionalProperties: false,
      required: ['foo'],
      properties: {
        foo: {
          type: 'boolean',
        },
      },
      default: {
        foo: true,
      },
    }

    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('should be possible to use default on primitives', () => {
    const parsedSchema = parseDefaultDef(z.string().default('default')._def, getRefs())
    const jsonSchema: JSONSchema7Type = {
      type: 'string',
      default: 'default',
    }
    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('default with transform', () => {
    const stringWithDefault = z
      .string()
      .transform((val) => val.toUpperCase())
      .default('default')

    const parsedSchema = parseDefaultDef(stringWithDefault._def, getRefs())
    const jsonSchema: JSONSchema7Type = {
      type: 'string',
      default: 'default',
    }

    expect(parsedSchema).toEqual(jsonSchema)
  })
})
