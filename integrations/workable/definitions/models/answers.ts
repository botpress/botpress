import { z } from '@botpress/sdk'

const baseAnswerSchema = z.object({
  questionKey: z.string().title('Question Key').describe('The question key'),
})

const freeTextAnswerSchema = z.object({
  body: z.string().title('Body').describe("The candidate's response"),
})

const shortTextAnswerSchema = z.object({
  body: z.string().max(128).title('Body').describe("The candidate's response"),
})

const booleanAnswerSchema = z.object({
  checked: z.boolean().title('Checked').describe("The candidate's response"),
})

const multipleChoiceAnswerSchema = z.object({
  choices: z.array(z.string()).title('Choices').describe('The IDs of the choice(s) selected'),
})

const dropdownAnswerSchema = z.object({
  choice: z.string().title('Choice').describe('The ID of the choice selected'),
})

const dateAnswerSchema = z.object({
  date: z.string().title('Date').describe('The date in ISO 8601 format'),
})

const numericAnswerSchema = z.object({
  number: z.number().title('Number').describe('The value may be an integer or a decimal number'),
})

const fileAnswerUrlSchema = z.object({
  fileUrl: z.string().title('File Url').describe("A url pointing to the candidate's answer"),
})
const fileAnswerBase64Schema = z.object({
  data: z.string().title('Data').describe("The candidate's answer encoded in base64"),
})

export const postAnswerSchema = z.union([
  baseAnswerSchema.merge(freeTextAnswerSchema),
  baseAnswerSchema.merge(shortTextAnswerSchema),
  baseAnswerSchema.merge(booleanAnswerSchema),
  baseAnswerSchema.merge(multipleChoiceAnswerSchema),
  baseAnswerSchema.merge(dropdownAnswerSchema),
  baseAnswerSchema.merge(dateAnswerSchema),
  baseAnswerSchema.merge(numericAnswerSchema),
  z.union([baseAnswerSchema.merge(fileAnswerUrlSchema), baseAnswerSchema.merge(fileAnswerBase64Schema)]),
])

export const answerSchema = z.object({
  question: z.object({
    body: z.string().nullable().title('Question').describe('The question'),
  }),
  answer: z
    .union([
      freeTextAnswerSchema,
      shortTextAnswerSchema,
      booleanAnswerSchema,
      multipleChoiceAnswerSchema,
      dropdownAnswerSchema,
      dateAnswerSchema,
      numericAnswerSchema,
      z.union([fileAnswerUrlSchema, fileAnswerBase64Schema]),
    ])
    .nullable()
    .title('Answer')
    .describe('The answer'),
})
