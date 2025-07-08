import { z } from '@botpress/sdk'
import { SendGridWebhookEventType } from '../src/misc/SendGridWebhookEventType'

const _BaseSendGridWebhookEventSchema = z.object({
  sg_event_id: z.string(),
  timestamp: z.number(),
})

export const BouncedEmailWebhookSchema = _BaseSendGridWebhookEventSchema.extend({
  event: z.literal(SendGridWebhookEventType.BOUNCE).describe('The type of event that was triggered'),
  /** "sg_message_id" is only absent during "Asynchronous Bounces" */
  sg_message_id: z.string().optional().describe('A SendGrid ID for a sent email message'),
  bounce_classification: z.string(),
  type: z.string(),
})

/** For event types which are associated with a sent email. They should always have the "sg_message_id" property */
const _BaseSentEmailWebhookEventSchema = _BaseSendGridWebhookEventSchema.extend({
  sg_message_id: z.string().describe('A SendGrid ID for a sent email message'),
})

export const DeliveredEmailWebhookSchema = _BaseSentEmailWebhookEventSchema.extend({
  event: z.literal(SendGridWebhookEventType.DELIVERED).describe('The type of event that was triggered'),
  email: z.string(),
})

export const ProcessedEmailWebhookSchema = _BaseSentEmailWebhookEventSchema.extend({
  event: z.literal(SendGridWebhookEventType.PROCESSED).describe('The type of event that was triggered'),
  send_at: z.number(),
})

export const DeferredEmailWebhookSchema = _BaseSentEmailWebhookEventSchema.extend({
  event: z.literal(SendGridWebhookEventType.DEFERRED).describe('The type of event that was triggered'),
  attempt: z.string(),
})

export const OpenedEmailWebhookSchema = _BaseSentEmailWebhookEventSchema.extend({
  event: z.literal(SendGridWebhookEventType.OPEN).describe('The type of event that was triggered'),
  email: z.string(),
})

export const SendGridWebhookEventSchema = z.union([
  ProcessedEmailWebhookSchema,
  DeliveredEmailWebhookSchema,
  DeferredEmailWebhookSchema,
  BouncedEmailWebhookSchema,
  OpenedEmailWebhookSchema,
])
