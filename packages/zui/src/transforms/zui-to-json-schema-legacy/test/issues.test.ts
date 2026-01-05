import { describe, test, expect } from 'vitest'
import { zuiKey } from '../../../ui/constants'
import { z } from '../../../z/index'
import { zodToJsonSchema } from '../zodToJsonSchema'

describe('Issue tests', () => {
  test('@94', () => {
    const topicSchema = z.object({
      topics: z
        .array(
          z.object({
            topic: z.string().describe('The topic of the position'),
          }),
        )
        .describe('An array of topics'),
    })

    const res = zodToJsonSchema(topicSchema)

    expect(res).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      [zuiKey]: {},
      required: ['topics'],
      properties: {
        topics: {
          type: 'array',
          [zuiKey]: {},
          items: {
            type: 'object',
            [zuiKey]: {},
            required: ['topic'],
            properties: {
              topic: {
                type: 'string',
                [zuiKey]: {},
                description: 'The topic of the position',
              },
            },
            additionalProperties: false,
          },
          description: 'An array of topics',
        },
      },
      additionalProperties: false,
    })
  })
})
