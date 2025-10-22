import { z } from '@botpress/sdk'
import { emailWebhookEventPayloadSchemas } from './email'
import { ignoredWebhookEventPayloadSchemas } from './ignored'

export const webhookEventPayloadSchemas = z.union([emailWebhookEventPayloadSchemas, ignoredWebhookEventPayloadSchemas])
export type WebhookEventPayloads = z.infer<typeof webhookEventPayloadSchemas>
