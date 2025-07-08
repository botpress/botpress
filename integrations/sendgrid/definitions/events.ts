import { z } from '@botpress/sdk'
import { EmailAddressSchema } from './common'

export const WebhookEmailEventPayload = z.object({
  eventId: z.string().describe('The ID for the webhook event').title('Webhook event ID'),
  /** 'messageId' will be present in almost every case where the event is tied to a sent email
   *   (So account status changed webhook events won't have one). The only exception to a sent
   *   email webhook event not having a message id is for "[Asynchronous Bounces](https://www.twilio.com/docs/sendgrid/ui/sending-email/bounces#asynchronous-bounces)". */
  messageId: z.string().optional().describe('The ID for the sent email message').title('Email message ID'),
  timestamp: z
    .string()
    .datetime()
    .describe('A UTC datetime representing when the event was triggered')
    .title('Event timestamp'),
})

export const ProcessedEmailEventPayload = WebhookEmailEventPayload.extend({
  sendAt: z
    .string()
    .datetime()
    .describe('A UTC datetime representing when the email is scheduled to be sent at')
    .title('Scheduled send timestamp'),
})

export const DeferredEmailEventPayload = WebhookEmailEventPayload.extend({
  attempt: z
    .string()
    .describe('The delivery attempts that have been made for the sent email')
    .title('Delivery attempts'),
})

export const DeliveredEmailEventPayload = WebhookEmailEventPayload.extend({
  email: z.string().describe('The designated recipient of the email').title('Email recipient'),
})

// So far this has only been seen in Bounce events, but I will check the other error events
// to see if they also contain this. Otherwise, I will merge into 'BouncedEmailEventPayload'
const _EmailErrorEventPayload = WebhookEmailEventPayload.extend({
  reason: z.string().optional().describe('The reason this event was triggered').title('Event reason'),
})

export const BouncedEmailEventPayload = _EmailErrorEventPayload.extend({
  classification: z.string().describe('The SendGrid classification for the bounce').title('Bounce classification'),
  type: z
    .string()
    .describe('The SendGrid type for why the email bounced (e.g. "bounce", "blocked", etc.)')
    .title('Bounce type'),
})

export const OpenedEmailEventPayload = _EmailErrorEventPayload.extend({
  email: EmailAddressSchema.describe('The designated recipient of the email').title('Email recipient'),
})

export const ClickedEmailLinkEventPayload = _EmailErrorEventPayload.extend({
  email: EmailAddressSchema.describe('The designated recipient of the email').title('Email recipient'),
  url: z.string().describe('The destination URL of the link that was clicked').title('Clicked URL'),
  urlOffset: z
    .number()
    .describe(
      'A zero-based index, ordered by first appearance, of which link was clicked in an email when it shares a "url" with another link'
    )
    .title('URL offset'),
})
