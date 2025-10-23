import { z } from '@botpress/sdk'
import { candidateSchema } from './candidates'

export const webhookEvent = z.object({
  fired_at: z.string(),
  id: z.string(),
  resource_type: z.string(),
})

export const candidateCreatedSchema = webhookEvent.extend({
  data: candidateSchema,
  event_type: z.literal('candidate_created'),
})

export const candidateMovedSchema = webhookEvent.extend({
  data: candidateSchema,
  event_type: z.literal('candidate_moved'),
})

export const webhookRequestSchema = z.union([candidateCreatedSchema, candidateMovedSchema])
