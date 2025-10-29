import { z } from '@botpress/sdk'

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
      fileAnswerUrlSchema,
      fileAnswerBase64Schema,
    ])
    .nullable()
    .title('Answer')
    .describe('The answer'),
})

export const postAnswerSchema = z.object({
  questionKey: z.string().title('Question Key').describe('The question key'),
  body: z.string().optional().title('Body').describe("The candidate's response"),
  checked: z.boolean().optional().title('Checked').describe("The candidate's response"),
  choices: z.array(z.string()).optional().title('Choices').describe('The IDs of the choice(s) selected'),
  date: z.string().optional().title('Date').describe('The date in ISO 8601 format'),
  value: z.number().optional().title('Value').describe('The value may be an integer or a decimal number'),
  fileUrl: z.string().optional().title('File Url').describe("A url pointing to the candidate's answer"),
  data: z.string().optional().title('Data').describe("The candidate's answer encoded in base64"),
})
