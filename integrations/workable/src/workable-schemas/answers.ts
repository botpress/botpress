import { z } from '@botpress/sdk'

const basePostAnswerSchema = z.object({
  question_key: z.string(),
})

const freeTextAnswerSchema = z.object({
  body: z.string(),
})

const shortTextAnswerSchema = z.object({
  body: z.string().max(128),
})

const booleanAnswerSchema = z.object({
  checked: z.boolean(),
})

const multipleChoiceAnswerSchema = z.object({
  choices: z.array(z.object({ body: z.string() })),
})

const postMultipleChoiceAnswerSchema = z.object({
  choices: z.array(z.string()),
})

const dateAnswerSchema = z.object({
  date: z.string(),
})

const numericAnswerSchema = z.object({
  number: z.number(),
})

const postNumericAnswerSchema = z.object({
  value: z.number(),
})

const fileAnswerUrlSchema = z.object({
  file_url: z.string(),
})
const fileAnswerBase64Schema = z.object({
  data: z.string(),
})

export const postAnswerSchema = z.union([
  basePostAnswerSchema.merge(freeTextAnswerSchema),
  basePostAnswerSchema.merge(shortTextAnswerSchema),
  basePostAnswerSchema.merge(booleanAnswerSchema),
  basePostAnswerSchema.merge(postMultipleChoiceAnswerSchema),
  basePostAnswerSchema.merge(dateAnswerSchema),
  basePostAnswerSchema.merge(postNumericAnswerSchema),
  basePostAnswerSchema.merge(fileAnswerUrlSchema),
  basePostAnswerSchema.merge(fileAnswerBase64Schema),
])

export const answerSchema = z.object({
  question: z.object({
    body: z.string().nullable(),
  }),
  answer: z
    .union([
      freeTextAnswerSchema,
      shortTextAnswerSchema,
      booleanAnswerSchema,
      multipleChoiceAnswerSchema,
      dateAnswerSchema,
      numericAnswerSchema,
      fileAnswerUrlSchema,
      fileAnswerBase64Schema,
    ])
    .nullable(),
})
