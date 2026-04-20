import { z } from '@botpress/sdk'
import { tallyFieldSchema } from './tally-fields'

export const formSchema = z.object({
  formId: z.string().min(1).describe('Form ID').title('Form ID'),
  fields: z.array(tallyFieldSchema).default([]).describe('Form fields').title('Fields'),
})

export const webhookSchema = z
  .object({
    eventId: z.string().describe('Event ID').title('Event ID'),
    eventType: z.literal('FORM_RESPONSE').describe('Event Type').title('Event Type'),
    createdAt: z.string().describe('Creation Date').title('Created At'),
    data: z
      .object({
        responseId: z.string().optional().describe('Response ID').title('Response ID'),
        submissionId: z.string().optional().describe('Submission ID').title('Submission ID'),
        respondentId: z.string().optional().describe('Respondent ID').title('Respondent ID'),
        formId: z.string().describe('Form ID').title('Form ID'),
        formName: z.string().optional().describe('Form Name').title('Form Name'),
        createdAt: z.string().optional().describe('Creation Date').title('Created At'),
        fields: z.array(tallyFieldSchema).default([]).describe('Form fields').title('Fields'),
      })
      .passthrough(),
  })
  .passthrough()
