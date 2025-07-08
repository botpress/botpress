import { z } from '@botpress/sdk'
import { EmailAddressSchema } from './common'

const _webhookEmailEventSchema = z.object({
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

export const processedEmailEventSchema = _webhookEmailEventSchema.extend({
  sendAt: z
    .string()
    .datetime()
    .describe('A UTC datetime representing when the email is scheduled to be sent at')
    .title('Scheduled send timestamp'),
})

export const deferredEmailEventSchema = _webhookEmailEventSchema.extend({
  attempt: z
    .string()
    .describe('The delivery attempts that have been made for the sent email')
    .title('Delivery attempts'),
})

export const deliveredEmailEventSchema = _webhookEmailEventSchema.extend({
  email: z.string().describe('The designated recipient of the email').title('Email recipient'),
})

// So far this has only been seen in Bounce events, but I will check the other error events
// to see if they also contain this. Otherwise, I will merge into 'BouncedEmailEventPayload'
const _emailErrorEventSchema = _webhookEmailEventSchema.extend({
  reason: z.string().optional().describe('The reason this event was triggered').title('Event reason'),
})

export const bouncedEmailEventSchema = _emailErrorEventSchema.extend({
  classification: z.string().describe('The SendGrid classification for the bounce').title('Bounce classification'),
  type: z
    .string()
    .describe('The SendGrid type for why the email bounced (e.g. "bounce", "blocked", etc.)')
    .title('Bounce type'),
})

export const openedEmailEventSchema = _emailErrorEventSchema.extend({
  email: EmailAddressSchema.describe('The designated recipient of the email').title('Email recipient'),
})

export const clickedEmailLinkEventSchema = _emailErrorEventSchema.extend({
  email: EmailAddressSchema.describe('The designated recipient of the email').title('Email recipient'),
  url: z.string().describe('The destination URL of the link that was clicked').title('Clicked URL'),
  urlOffset: z
    .number()
    .describe(
      'A zero-based index, ordered by first appearance, of which link was clicked in an email when it shares a "url" with another link'
    )
    .title('URL offset'),
})
