import { z } from 'zod'
import { describe, test } from 'vitest'
import { type UIComponentDefinitions } from './types'

const testExtensions = [
  {
    id: 'SuperInput',
    type: 'string',
    schema: z.object({ allowVariables: z.boolean().optional() }),
  },
  {
    id: 'SuperPasswordInput',
    type: 'string',
    schema: z.object({
      requireSpecialCharacters: z.boolean().default(false).optional(),
      requireNumbers: z.boolean().default(false).optional(),
      requireLowercase: z.boolean().default(false).optional(),
      requireUppercase: z.boolean().default(false).optional(),
      minLength: z.number().default(8).optional(),
      maxLength: z.number().optional(),
    }),
  },
  {
    id: 'SuperNumber',
    type: 'number',
    schema: z.object({ min: z.number().optional(), max: z.number().optional() }),
  },
  {
    id: 'SuperCheckbox',
    type: 'boolean',
    schema: z.object({ label: z.string().optional() }),
  },
  {
    id: 'SuperArray',
    type: 'array',
    schema: z.object({ minItems: z.number().optional(), maxItems: z.number().optional() }),
  },
  {
    id: 'SuperObject',
    type: 'object',
    schema: z.object({ label: z.string().optional() }),
  },
] as const satisfies UIComponentDefinitions

describe('ZUI UI Extensions', () => {
  test('should be able to extend zui using module declaration', () => {
    const aSchema = z.object({
      myString: z.string().displayAs<typeof testExtensions>('SuperInput', {
        allowVariables: true,
      }),
      myNumber: z.number().displayAs<typeof testExtensions>('SuperNumber', {
        max: 100,
      }),
      myBoolean: z.boolean().displayAs<typeof testExtensions>('SuperCheckbox', {
        label: 'This is a checkbox',
      }),
    })

    aSchema.toJsonSchema()
  })
})
