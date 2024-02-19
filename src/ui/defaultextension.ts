import { z } from 'zod'
import { UIComponentDefinitions } from './types'
import { SchemaResolversMap } from './types'

const commonInputSchema = z.object({})

export const defaultExtensions = {
  string: {
    textbox: {
      id: 'textbox',
      schema: commonInputSchema.extend({
        multiline: z.boolean().default(false).optional(),
        fitContentWidth: z.boolean().default(false).optional(),
      }),
    },
    datetimeinput: {
      id: 'datetimeinput',
      schema: commonInputSchema.extend({
        type: z.enum(['time', 'date', 'date-time']).default('date-time'),
      }),
    },
  },
  number: {
    numberinput: {
      id: 'numberinput',
      schema: commonInputSchema,
    },
    slider: {
      id: 'slider',
      schema: commonInputSchema,
    },
  },
  boolean: {
    checkbox: {
      id: 'checkbox',
      schema: commonInputSchema.extend({
        toggle: z.boolean().default(false).optional(),
      }),
    },
  },
  array: {
    select: {
      id: 'select',
      schema: z.undefined(),
    },
  },
  object: {
    verticalLayout: {
      id: 'verticalLayout',
      schema: z.object({}),
    },
    horizontalLayout: {
      id: 'horizontalLayout',
      schema: z.object({}),
    },
    group: {
      id: 'group',
      schema: z.object({}),
    },
    categorization: {
      id: 'categorization',
      schema: z.object({}),
    },
    category: {
      id: 'category',
      schema: z.object({}),
    },
  },
} as const satisfies UIComponentDefinitions

export const resolverOverrides: SchemaResolversMap<typeof defaultExtensions> = {}
