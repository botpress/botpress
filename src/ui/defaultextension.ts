import { z } from 'zod'
import { UICategorySchema, UIComponentDefinitions } from './types'
import { ComponentImplementationMap } from './types'

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

export const defaultExtensionComponents: ComponentImplementationMap<typeof defaultExtensions> = {
  string: {
    textbox: ({ multiline, fitContentWidth }, { scope, zuiProps }) => {
      return {
        type: 'Control',
        scope,
        label: zuiProps.title ?? true,
        options: {
          multi: multiline,
          readOnly: zuiProps.disabled ?? false,
          trim: fitContentWidth,
        },
      }
    },
    datetimeinput: ({ type }, { scope, zuiProps }) => {
      return {
        type: 'Control',
        scope,
        label: zuiProps.title ?? true,
        options: {
          format: type,
          readOnly: zuiProps.disabled ?? false,
        },
      }
    },
    default: (_, { scope, zuiProps }) => {
      return {
        type: 'Control',
        scope,
        label: zuiProps.title ?? true,
        options: {
          readOnly: zuiProps.disabled ?? false,
        },
      }
    },
  },
  number: {
    numberinput: (_, { scope, zuiProps }) => {
      return {
        type: 'Control',
        scope,
        label: zuiProps.title ?? true,
        options: {
          readOnly: zuiProps.disabled ?? false,
        },
      }
    },
    slider: (_, { scope, zuiProps }) => {
      return {
        type: 'Control',
        scope,
        label: zuiProps.title ?? false,
        options: {
          slider: true,
          readOnly: zuiProps.disabled ?? false,
        },
      }
    },
  },
  array: {
    select: (_, __, children) => {
      return {
        type: 'VerticalLayout',
        elements: children,
      }
    },
  },
  boolean: {
    checkbox: (_, { scope, zuiProps }) => {
      return {
        type: 'Control',
        scope,
        label: zuiProps.title ?? true,
        options: {
          readOnly: zuiProps.disabled ?? false,
        },
      }
    },
  },
  object: {
    verticalLayout: (_, __, children) => {
      return {
        type: 'VerticalLayout',
        elements: children,
      }
    },
    horizontalLayout: (_, __, children) => {
      return {
        type: 'HorizontalLayout',
        elements: children,
      }
    },
    category: (_, { zuiProps }, children) => {
      return {
        type: 'Category',
        label: zuiProps.title,
        elements: children,
      }
    },
    categorization: (_, __, children) => {
      return {
        type: 'Categorization',
        elements: children as UICategorySchema[],
      }
    },
    group: (_, { zuiProps }, children) => {
      return {
        type: 'Group',
        label: zuiProps.title,
        elements: children,
      }
    },
    default: (_, __, children) => {
      return {
        type: 'HorizontalLayout',
        elements: children,
      }
    },
  },
}
