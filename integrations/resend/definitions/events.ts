import { z } from '@botpress/sdk'

export const emailHeaderSchema = z.object({
  name: z.string().title('Header Name').describe('The name of the email header'),
  value: z.string().title('Header Value').describe('The value of the email header'),
})

export const emailTagSchema = z.object({
  name: z.string().title('Tag Name').describe('The name of the email tag'),
  value: z.string().title('Tag Value').describe('The value of the email tag'),
})

const _baseWebhookEmailEventSchema = z.object({
  emailId: z.string().optional().title('Email ID').describe('The ID for the sent email'),
  createdAt: z
    .string()
    .datetime()
    .title('Event datetime')
    .describe('An ISO8601 datetime representing when the event was triggered'),
  subject: z.string().title('Email subject').describe('The subject of the email'),
  from: z.string().title('Email sender').describe('The sender of the email'),
  to: z.array(z.string()).min(1).title('Email recipients').describe('The recipients of the email'),
  cc: z.array(z.string()).min(1).optional().title('Carbon Copy').describe('The carbon copy recipients of the email'),
  bcc: z
    .array(z.string())
    .min(1)
    .optional()
    .title('Blind Carbon Copy')
    .describe('The blind carbon copy recipients of the email'),
  headers: z.array(emailHeaderSchema).min(1).optional().title('Email headers').describe('The headers of the email'),
  tags: z.array(emailTagSchema).min(1).optional().title('Email tags').describe('The tags of the email'),
})

export const sentEmailEventSchema = _baseWebhookEmailEventSchema

export const delayedDeliveryEmailEventSchema = _baseWebhookEmailEventSchema

export const deliveredEmailEventSchema = _baseWebhookEmailEventSchema

export const markedAsSpamEmailEventSchema = _baseWebhookEmailEventSchema

const _emailErrorEventSchema = _baseWebhookEmailEventSchema.extend({
  reason: z.string().title('Event reason').describe('The reason this event was triggered'),
})

export const bouncedEmailEventSchema = _emailErrorEventSchema.extend({
  type: z
    .string()
    .title('Bounce type')
    .describe('The Resend type for why the email bounced (e.g. "Permanent", "Transient", "Undetermined")'),
  subtype: z
    .string()
    .title('Bounce subtype')
    .describe('The Resend subtype for why the email bounced (e.g. "General", "NoEmail", "MailboxFull", etc.)'),
})

export const openedEmailEventSchema = _baseWebhookEmailEventSchema.extend({
  openedAt: z
    .string()
    .datetime()
    .title('Email opened datetime')
    .describe('An ISO8601 datetime representing when the email was opened'),
})

export const clickedEmailLinkEventSchema = _baseWebhookEmailEventSchema.extend({
  clickedAt: z
    .string()
    .datetime()
    .title('Link clicked datetime')
    .describe('An ISO8601 datetime representing when a link in the email was clicked'),
  url: z.string().title('Clicked URL').describe('The destination URL of the link that was clicked'),
})

export const failedToSendEmailEventSchema = _emailErrorEventSchema
