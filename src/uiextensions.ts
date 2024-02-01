import { ZodSchema, ZodType, z } from 'zod'

export type BaseType = 'number' | 'string' | 'boolean' | 'object' | 'array'

export type UIExtension = {
  [type in BaseType]: {
    [id: string | number | symbol]: {
      id: string
      schema: ZodSchema
    }
  }
}

export interface UIExtensionDefinition {}

export type GlobalExtensionDefinition = UIExtensionDefinition extends {
  extensions: infer TExtensions extends UIExtension
}
  ? TExtensions
  : any

export type ZodToBaseType<T extends ZodType> = T extends z.ZodString
  ? 'string'
  : T extends z.ZodBoolean
  ? 'boolean'
  : T extends z.ZodNumber
  ? 'number'
  : T extends z.ZodArray<any, any>
  ? 'array'
  : T extends z.ZodObject<any, any>
  ? 'object'
  : any

export const commonHTMLInputSchema = z.object({
  name: z.string(),
  id: z.string().optional(),
  disabled: z.boolean().default(false).optional(),
  readonly: z.boolean().default(false).optional(),
  hidden: z.boolean().default(false).optional(),
  autofocus: z.boolean().default(false).optional(),
  required: z.boolean().default(false).optional(),
})

export const defaultExtensions = {
  string: {
    textbox: {
      id: 'textbox',
      schema: commonHTMLInputSchema.extend({
        type: z.enum(['text', 'password', 'email', 'tel', 'url']).default('text'),
        default: z.string().optional(),
        maxLength: z.number().optional(),
        minLength: z.number().optional(),
        pattern: z.string().optional(),
        placeholder: z.string().optional(),
      }),
    },
    datetimeinput: {
      id: 'datetimeinput',
      schema: commonHTMLInputSchema.extend({
        type: z.enum(['datetime-local', 'date', 'week']).default('datetime-local'),
        default: z.string().optional(),
        min: z.string().optional(),
        max: z.string().optional(),
      }),
    },
  },
  number: {
    numberinput: {
      id: 'numberinput',
      schema: commonHTMLInputSchema.extend({
        type: z.literal('number'),
        default: z.number().optional().default(0),
        min: z.number().optional().default(0),
        max: z.number().optional(),
        step: z.number().default(0).optional(),
      }),
    },
    slider: {
      id: 'slider',
      schema: commonHTMLInputSchema.extend({
        type: z.literal('range'),
        default: z.number().optional().default(0),
        min: z.number().optional().default(0),
        max: z.number().optional(),
        step: z.number().default(0).optional(),
      }),
    },
  },
  boolean: {
    checkbox: {
      id: 'checkbox',
      schema: commonHTMLInputSchema.extend({
        default: z.boolean().default(false).optional(),
      }),
    },
  },
  array: {
    select: {
      id: 'select',
      schema: commonHTMLInputSchema.extend({
        default: z.string().optional(),
        options: z.array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        ),
      }),
    },
  },
  object: {},
} as const satisfies UIExtension
