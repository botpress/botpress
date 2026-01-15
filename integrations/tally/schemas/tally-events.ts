import { z } from '@botpress/sdk'
import { tallyFieldSchema } from './tally-fields'

export const formFieldsSchema = z.object({
  fields: z.array(tallyFieldSchema).default([]),
})

export const webhookSchema = z
  .object({
    eventId: z.string(),
    eventType: z.literal('FORM_RESPONSE'),
    createdAt: z.string(),
    data: z
      .object({
        responseId: z.string().optional(),
        submissionId: z.string().optional(),
        respondentId: z.string().optional(),
        formId: z.string(),
        formName: z.string().optional(),
        createdAt: z.string().optional(),
        fields: z.array(tallyFieldSchema).default([]),
      })
      .passthrough(),
  })
  .passthrough()
