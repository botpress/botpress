import { z } from '@botpress/sdk'

export const eventScheduledSchema = z.object({
  event: z.string(),
  conversationId: z.string().optional(),
})
