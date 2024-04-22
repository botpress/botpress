import { z } from '../z/index'
import { describe, test } from 'vitest'
import { type UIComponentDefinitions } from './types'

const testExtensions = {
  string: {
    SuperInput: {
      id: 'SuperInput',
      params: z.object({ allowVariables: z.boolean().optional() }),
    },
    SuperPasswordInput: {
      id: 'SuperPasswordInput',
      params: z.object({
        requireSpecialCharacters: z.boolean().default(false).optional(),
        requireNumbers: z.boolean().default(false).optional(),
        requireLowercase: z.boolean().default(false).optional(),
        requireUppercase: z.boolean().default(false).optional(),
        minLength: z.number().default(8).optional(),
        maxLength: z.number().optional(),
      }),
    },
  },
  number: {
    SuperNumber: {
      id: 'SuperNumber',
      params: z.object({ min: z.number().optional(), max: z.number().optional() }),
    },
  },
  boolean: {
    SuperCheckbox: {
      id: 'SuperCheckbox',
      params: z.object({ label: z.string().optional() }),
    },
  },
  array: {
    SuperArray: {
      id: 'SuperArray',
      params: z.object({ minItems: z.number().optional(), maxItems: z.number().optional() }),
    },
  },
  object: {
    SuperObject: {
      id: 'SuperObject',
      params: z.object({ label: z.string().optional() }),
    },
  },
  discriminatedUnion: {},
} as const satisfies UIComponentDefinitions

describe('ZUI UI Extensions', () => {
  test('should be able to extend zui using module declaration', () => {
    const aSchema = z.object({
      myString: z.string().displayAs<typeof testExtensions>({
        id: 'SuperInput',
        params: { allowVariables: true },
      }),
      myNumber: z.number().displayAs<typeof testExtensions>({
        id: 'SuperNumber',
        params: { max: 100 },
      }),
      myBoolean: z.boolean().displayAs<typeof testExtensions>({
        id: 'SuperCheckbox',
        params: { label: 'This is a checkbox' },
      }),
    })

    aSchema.toJsonSchema()
  })
})
