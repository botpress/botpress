import { z } from '@botpress/sdk'
import { emailWebhookEventSchema } from './emails'
import { ignoredWebhookSchemas } from './ignored'

export const webhookEventPayloadSchemas = z.union([emailWebhookEventSchema, ignoredWebhookSchemas])
export type WebhookEventPayloads = z.infer<typeof webhookEventPayloadSchemas>
