import { z } from '@botpress/sdk'
import { emailHeaderSchema, emailTagSchema } from '../src/webhook-events/schemas/email'

const _baseWebhookEmailEventSchema = z.object({
  emailId: z.string().optional().describe('The ID for the sent email').title('Email ID'),
  createdAt: z
    .string()
    .datetime()
    .describe('An ISO8601 datetime representing when the event was triggered')
    .title('Event datetime'),
  subject: z.string().describe('The subject of the email').title('Email subject'),
  from: z.string().describe('The sender of the email').title('Email sender'),
  to: z.array(z.string()).min(1).describe('The recipients of the email').title('Email recipients'),
  cc: z.array(z.string()).min(1).optional(),
  bcc: z.array(z.string()).min(1).optional(),
  headers: z.array(emailHeaderSchema).min(1).optional(),
  tags: z.array(emailTagSchema).min(1).optional(),
})

export const sentEmailEventSchema = _baseWebhookEmailEventSchema

export const delayedDeliveryEmailEventSchema = _baseWebhookEmailEventSchema

export const deliveredEmailEventSchema = _baseWebhookEmailEventSchema

export const markedAsSpamEmailEventSchema = _baseWebhookEmailEventSchema

const _emailErrorEventSchema = _baseWebhookEmailEventSchema.extend({
  reason: z.string().describe('The reason this event was triggered').title('Event reason'),
})

export const bouncedEmailEventSchema = _emailErrorEventSchema.extend({
  type: z
    .string()
    .describe('The Resend type for why the email bounced (e.g. "Permanent", "Transient", "Undetermined")')
    .title('Bounce type'),
  subtype: z
    .string()
    .describe('The Resend subtype for why the email bounced (e.g. "General", "NoEmail", "MailboxFull", etc.)')
    .title('Bounce subtype'),
})

export const openedEmailEventSchema = _baseWebhookEmailEventSchema.extend({
  openedAt: z
    .string()
    .datetime()
    .describe('An ISO8601 datetime representing when the email was opened')
    .title('Email opened datetime'),
})

export const clickedEmailLinkEventSchema = _baseWebhookEmailEventSchema.extend({
  clickedAt: z
    .string()
    .datetime()
    .describe('An ISO8601 datetime representing when a link in the email was clicked')
    .title('Link clicked datetime'),
  url: z.string().describe('The destination URL of the link that was clicked').title('Clicked URL'),
})

export const failedToSendEmailEventSchema = _emailErrorEventSchema
