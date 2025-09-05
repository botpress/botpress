import { z } from '@botpress/sdk'

export const ignoredWebhookEventPayloadSchemas = z
  .object({
    type: z.union([
      z.literal('contact.created'),
      z.literal('contact.updated'),
      z.literal('contact.deleted'),
      z.literal('domain.created'),
      z.literal('domain.updated'),
      z.literal('domain.deleted'),
    ]),
  })
  .passthrough()
