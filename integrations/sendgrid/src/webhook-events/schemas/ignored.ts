import { z } from '@botpress/sdk'

export const ignoredWebhookSchemas = z
  .object({
    // Add other events as necessary
    event: z.literal('dropped'),
  })
  .passthrough()
