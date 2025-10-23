import { z } from '@botpress/sdk'
import { eventTypes } from 'definitions/events/candidates'
import { candidateSchema } from './candidates'

export const webhookEvent = z.object({
  fired_at: z.string(),
  id: z.string(),
  resource_type: z.string(),
})

export const candidateCreatedSchema = webhookEvent.extend({
  data: candidateSchema,
  event_type: z.literal(eventTypes.Values.candidate_created),
})

export const candidateMovedSchema = webhookEvent.extend({
  data: candidateSchema,
  event_type: z.literal(eventTypes.Values.candidate_moved),
})

export const registerWebhookInputSchema = z.object({
  target: z.string(),
  event: eventTypes,
  args: z.object({
    account_id: z.string(),
    job_shortcode: z.string(),
    stage_slug: z.string(),
  }),
})

export const registerWebhookOutputSchema = z.object({
  id: z.number(),
})

export const getWebhooksOutputSchema = z.object({
  subscriptions: z.array(
    z.object({
      id: z.number(),
      event: z.string(),
      target: z.string(),
      valid_util: z.string().nullable(),
      created_at: z.string().nullable(),
      stage_slug: z.string().nullable(),
      job_shortcode: z.string().nullable(),
    })
  ),
})

export const webhookRequestSchema = z.union([candidateCreatedSchema, candidateMovedSchema])
