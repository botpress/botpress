import { z } from 'zod'

/**
 * Schemas as defined by the Messaging API
 */

export const textSchema = z.object({ text: z.string(), markdown: z.boolean().optional() })

export const imageSchema = z.object({ image: z.string() })

export const cardSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  image: z.string().optional(),
  actions: z
    .array(z.object({ title: z.string(), action: z.enum(['Open URL', 'Postback', 'Say something']) }))
    .optional(),
})

export const carouselSchame = z.object({ items: z.array(cardSchema) })

export const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  title: z.string().optional(),
})

export const dropdownSchema = z.object({
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

export const singleChoiceSchema = z.object({
  text: z.string(),
  disableFreeText: z.boolean().optional(),
  choices: z.array(z.object({ title: z.string(), value: z.string() })),
})

export const fileSchema = z.object({
  file: z.string(),
  title: z.string().optional(),
})

export const videoSchema = z.object({
  video: z.string(),
  title: z.string().optional(),
})

export const audioSchema = z.object({
  audio: z.string(),
  title: z.string().optional(),
})
