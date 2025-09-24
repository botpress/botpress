import { z } from '@botpress/sdk'
import { baseIdentifierSchema } from '../definitions/actions'

// Base event schema that all Attio events share
export const recordEventSchema = z.object({
  event_type: z.string().title('Event Type').describe('The type of event'),
  id: baseIdentifierSchema.extend({ record_id: z.string().title('Record ID').describe('The record identifier') }),
  actor: z.object({
    type: z.string().title('Actor Type').describe('The type of actor (e.g., workspace-member)'),
    id: z.string().title('Actor ID').describe('The actor identifier'),
  }),
})

// Webhook payload schema
export const webhookPayloadSchema = z.object({
  webhook_id: z.string().title('Webhook ID').describe('The webhook identifier'),
  events: z.array(recordEventSchema).title('Events').describe('Array of events'),
})
