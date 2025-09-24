import { z } from '@botpress/sdk'
import { baseIdentifierSchema } from '../definitions/common'

export const recordEventSchema = z.object({
  event_type: z.string(),
  id: baseIdentifierSchema.extend({ record_id: z.string() }),
  actor: z.object({
    type: z.string(),
    id: z.string(),
  }),
})

export const webhookPayloadSchema = z.object({
  webhook_id: z.string(),
  events: z.array(recordEventSchema),
})
