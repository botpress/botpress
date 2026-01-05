import { describe, it, expect } from 'vitest'
import { z } from '../../../z/index'
import { zodToJsonSchema } from '../zodToJsonSchema'
import { zuiKey } from '../../../ui/constants'

describe('Meta data', () => {
  it('should be possible to use description', () => {
    const $z = z.string().describe('My neat string')
    const $j = zodToJsonSchema($z)
    const $e = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'string',
      description: 'My neat string',
      [zuiKey]: {},
    }

    expect($j).toEqual($e)
  })

  it('should be possible to add a markdownDescription', () => {
    const $z = z.string().describe('My neat string')
    const $j = zodToJsonSchema($z, { markdownDescription: true })
    const $e = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'string',
      description: 'My neat string',
      markdownDescription: 'My neat string',
      [zuiKey]: {},
    }

    expect($j).toEqual($e)
  })

  it('should handle optional schemas with different descriptions', () => {
    const recurringSchema = z.object({})
    const zodSchema = z
      .object({
        p1: recurringSchema.optional().describe('aaaaaaaaa'),
        p2: recurringSchema.optional().describe('bbbbbbbbb'),
        p3: recurringSchema.optional().describe('ccccccccc'),
      })
      .describe('sssssssss')

    const jsonSchema = zodToJsonSchema(zodSchema, {
      target: 'openApi3',
      $refStrategy: 'none',
    })

    expect(jsonSchema).toEqual({
      additionalProperties: false,
      description: 'sssssssss',
      properties: {
        p1: {
          additionalProperties: false,
          description: 'aaaaaaaaa',
          properties: {},
          type: 'object',
          [zuiKey]: {},
        },
        p2: {
          additionalProperties: false,
          description: 'bbbbbbbbb',
          properties: {},
          type: 'object',
          [zuiKey]: {},
        },
        p3: {
          additionalProperties: false,
          description: 'ccccccccc',
          properties: {},
          type: 'object',
          [zuiKey]: {},
        },
      },
      type: 'object',
      [zuiKey]: {},
    })
  })
})
