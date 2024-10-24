import { it, expect, describe } from 'vitest'
import { dereferenceSchema } from './schema-utils'
import { JSONSchema7 } from 'json-schema'

describe('dereferenceSchema', () => {
  it('should do nothing if no $ref', async () => {
    const schema: JSONSchema7 = { type: 'object' }
    const result = await dereferenceSchema(schema)
    expect(result).toEqual(schema)
  })

  it('should dereference local $ref', async () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        foo: { $ref: '#/$defs/foo' },
        bar: { $ref: '#/definitions/bar' },
      },
      $defs: {
        foo: { type: 'string' },
      },
      definitions: {
        bar: { type: 'number' },
      },
    }
    const result = await dereferenceSchema(schema)
    expect(result).toEqual({
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'number' },
      },
      $defs: {
        foo: { type: 'string' },
      },
      definitions: {
        bar: { type: 'number' },
      },
    })
  })

  it('should ignore non-local $ref', async () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        foo: { $ref: 'TItem' },
      },
    }
    const result = await dereferenceSchema(schema)
    expect(result).toEqual(schema)
  })
})
