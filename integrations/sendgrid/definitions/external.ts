import { z } from '@botpress/sdk'

const _baseSendGridWebhookEventSchema = z.object({
  sg_event_id: z.string(),
  timestamp: z.number(),
})

export type BouncedEmailWebhook = z.infer<typeof bouncedEmailWebhookSchema>
export const bouncedEmailWebhookSchema = _baseSendGridWebhookEventSchema.extend({
  event: z.literal('bounce').describe('The type of event that was triggered'),
  /** "sg_message_id" is only absent during "Asynchronous Bounces" */
  sg_message_id: z.string().optional().describe('A SendGrid ID for a sent email message'),
  bounce_classification: z.string(),
  /** The "Event Objects" table in the docs is out of sync because it says the "type" property isn't part of the "bounce" events even though it is. */
  type: z.string(),
})

/** For event types which are associated with a sent email. They should always have the "sg_message_id" property */
const _baseSentEmailWebhookEventSchema = _baseSendGridWebhookEventSchema.extend({
  sg_message_id: z.string().describe('A SendGrid ID for a sent email message'),
})

export type DeliveredEmailWebhook = z.infer<typeof deliveredEmailWebhookSchema>
export const deliveredEmailWebhookSchema = _baseSentEmailWebhookEventSchema.extend({
  event: z.literal('delivered').describe('The type of event that was triggered'),
  email: z.string(),
})

export type ProcessedEmailWebhook = z.infer<typeof processedEmailWebhookSchema>
export const processedEmailWebhookSchema = _baseSentEmailWebhookEventSchema.extend({
  event: z.literal('processed').describe('The type of event that was triggered'),
  send_at: z.number(),
})

export type DeferredEmailWebhook = z.infer<typeof deferredEmailWebhookSchema>
export const deferredEmailWebhookSchema = _baseSentEmailWebhookEventSchema.extend({
  event: z.literal('deferred').describe('The type of event that was triggered'),
  attempt: z.string(),
})

export type OpenedEmailWebhook = z.infer<typeof openedEmailWebhookSchema>
export const openedEmailWebhookSchema = _baseSentEmailWebhookEventSchema.extend({
  event: z.literal('open').describe('The type of event that was triggered'),
  email: z.string(),
})

export type ClickedEmailWebhook = z.infer<typeof clickedEmailWebhookSchema>
export const clickedEmailWebhookSchema = _baseSentEmailWebhookEventSchema.extend({
  event: z.literal('click').describe('The type of event that was triggered'),
  email: z.string(),
  url: z.string().describe('The url of the clicked link'),
  /** The "url_offset" is to better track which link was
   *  clicked when more than 1 link shares the same url. */
  url_offset: z.object({
    index: z.number().describe('A zero-based index which link was clicked in the email ordered by first appearance'),
    type: z.string(),
  }),
})

export type SendGridWebhookEvent = z.infer<typeof sendGridWebhookEventSchema>
export const sendGridWebhookEventSchema = z.union([
  processedEmailWebhookSchema,
  deliveredEmailWebhookSchema,
  deferredEmailWebhookSchema,
  bouncedEmailWebhookSchema,
  openedEmailWebhookSchema,
  clickedEmailWebhookSchema,
])
