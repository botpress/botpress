import { z } from 'zod'

/**
 * Schemas as defined by the Messaging API
 */

export const baseSchema = z.object({ className: z.string().optional(), avatarUrl: z.string().url().optional() })

export const textSchema = baseSchema.extend({ text: z.string(), markdown: z.boolean().optional() })

export const imageSchema = baseSchema.extend({ image: z.string() })

export const cardSchema = baseSchema.extend({
  title: z.string(),
  subtitle: z.string().optional(),
  image: z.string().optional(),
  actions: z
    .array(z.object({ title: z.string(), action: z.enum(['Open URL', 'Postback', 'Say something']) }))
    .optional(),
})

export const carouselSchame = baseSchema.extend({ items: z.array(cardSchema) })

export const locationSchema = baseSchema.extend({
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  title: z.string().optional(),
})

export const dropdownSchema = baseSchema.extend({
  message: z.string(),
  options: z.array(z.object({ label: z.string(), value: z.string() })),
  allowCreation: z.boolean().optional(),
  placeholderText: z.string().optional(),
  allowMultiple: z.boolean().optional(),
  buttonText: z.string().optional(),
  width: z.number().optional(),
  displayInKeyboard: z.boolean().optional(),
  markdown: z.boolean().optional(),
})

export const singleChoiceSchema = baseSchema.extend({
  text: z.string(),
  disableFreeText: z.boolean().optional(),
  choices: z.array(z.object({ title: z.string(), value: z.string() })),
})

export const fileSchema = baseSchema.extend({
  file: z.string(),
  title: z.string().optional(),
})

export const videoSchema = baseSchema.extend({
  video: z.string(),
  title: z.string().optional(),
})

export const audioSchema = baseSchema.extend({
  audio: z.string(),
  title: z.string().optional(),
})
