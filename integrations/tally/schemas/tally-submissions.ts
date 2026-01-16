import { z } from '@botpress/sdk'

export const listSubmissionsInputSchema = z.object({
  formId: z.string(),
  page: z.number().int().min(1).optional(),
  filter: z.enum(['all', 'completed', 'partial']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  afterId: z.string().optional(),
})

export const listSubmissionsOuputSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      type: z.string().optional(),
      title: z.string().nullable().optional(),
    })
  ),
  submissions: z.array(
    z.object({
      id: z.string(),
      responses: z.array(
        z.object({
          questionId: z.string(),
          value: z.any().optional(),
          answer: z.any().optional(),
        })
      ),
    })
  ),
})
