import { z } from '@botpress/sdk'
import { questionType } from 'definitions/models/jobs'

export const getJobQuestionsInputSchema = z.object({
  shortCode: z.string(),
})

export const questionSchema = z.object({
  id: z.string(),
  body: z.string(),
  type: questionType,
  required: z.boolean(),
  single_answer: z.boolean().optional(),
  choices: z
    .array(
      z.object({
        id: z.string(),
        body: z.string(),
      })
    )
    .optional(),
  supported_file_types: z.array(z.string()).optional(),
  max_file_size: z.number().optional(),
})

export const getJobQuestionsOutputSchema = z.object({
  questions: z.array(questionSchema),
})
