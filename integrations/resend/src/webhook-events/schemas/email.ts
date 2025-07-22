import { z } from '@botpress/sdk'

// Check if events exist for "queued", "scheduled" & "canceled" (It's not documented in the webhook events doc, but might exist in the wild)
// Suspicion comes from: https://resend.com/docs/dashboard/emails/introduction#understand-email-events

// IMPORTANT NOTE: For the following events where it may only affect one of the
//  recipients, Resend doesn't distinguish which recipient the event occurred to:
//    - "email.delivery_delayed"
//    - "email.complained"
//    - "email.bounced"
//    - "email.opened"
//    - "email.clicked"
//    - "email.failed"

export const emailHeaderSchema = z.object({
  name: z.string(),
  value: z.string(),
})

export const emailTagSchema = z.object({
  name: z.string(),
  value: z.string(),
})

// Check if "cc" & "bcc" are included in the "to" field (It's included in an optional "headers" field)
export type BaseEmailWebhookData = z.infer<typeof _baseEmailWebhookDataSchema>
const _baseEmailWebhookDataSchema = z.object({
  /** This "created_at" is for the sent email */
  created_at: z.coerce.date(),
  email_id: z.string(),
  from: z.string(),
  to: z.array(z.string()),
  subject: z.string(),
  headers: z.array(emailHeaderSchema).optional(),
  tags: z.array(emailTagSchema).optional(),
})

export type EmailSentWebhook = z.infer<typeof _emailSentWebhookSchema>
const _emailSentWebhookSchema = z.object({
  /** This "created_at" is for the triggered event */
  type: z.literal('email.sent'),
  data: _baseEmailWebhookDataSchema,
  created_at: z.coerce.date(),
})

export type EmailDeliveredWebhook = z.infer<typeof _emailDeliveredWebhookSchema>
const _emailDeliveredWebhookSchema = z
  .object({
    type: z.literal('email.delivered'),
    data: _baseEmailWebhookDataSchema,
    created_at: z.coerce.date(),
  })
  .describe(
    "A webhook that indicates that an email was delivered to the recipient's email server. (However it is still possible to bounce after this)"
  )

export type EmailDelayedWebhook = z.infer<typeof _emailDelayedWebhookSchema>
const _emailDelayedWebhookSchema = z.object({
  type: z.literal('email.delivery_delayed'),
  data: _baseEmailWebhookDataSchema,
  created_at: z.coerce.date(),
})

export type EmailMarkedAsSpamWebhook = z.infer<typeof _emailMarkedAsSpamWebhookSchema>
const _emailMarkedAsSpamWebhookSchema = z.object({
  type: z.literal('email.complained'),
  data: _baseEmailWebhookDataSchema,
  created_at: z.coerce.date(),
})

export type EmailBouncedWebhook = z.infer<typeof _emailBouncedWebhookSchema>
const _emailBouncedWebhookSchema = z.object({
  type: z.literal('email.bounced'),
  data: _baseEmailWebhookDataSchema.extend({
    bounce: z.object({
      message: z.string(),
      type: z.string(),
      subType: z.string(),
    }),
  }),
  created_at: z.coerce.date(),
})

export type EmailOpenedWebhook = z.infer<typeof _emailOpenedWebhookSchema>
const _emailOpenedWebhookSchema = z.object({
  type: z.literal('email.opened'),
  data: _baseEmailWebhookDataSchema.extend({
    open: z.object({
      ipAddress: z.string(),
      timestamp: z.coerce.date(),
      userAgent: z.string(),
    }),
  }),
  created_at: z.coerce.date(),
})

export type EmailLinkClickedWebhook = z.infer<typeof _emailLinkClickedWebhookSchema>
const _emailLinkClickedWebhookSchema = z.object({
  type: z.literal('email.clicked'),
  data: _baseEmailWebhookDataSchema.extend({
    click: z.object({
      ipAddress: z.string(),
      link: z.string(),
      timestamp: z.coerce.date(),
      userAgent: z.string(),
    }),
  }),
  created_at: z.coerce.date(),
})

export type EmailFailedToSendWebhook = z.infer<typeof _emailFailedToSendWebhookSchema>
const _emailFailedToSendWebhookSchema = z.object({
  type: z.literal('email.failed'),
  data: _baseEmailWebhookDataSchema.extend({
    failed: z.object({
      reason: z.string(),
    }),
  }),
  created_at: z.coerce.date(),
})

export type EmailWebhookEventPayloads = z.infer<typeof emailWebhookEventPayloadSchemas>
export const emailWebhookEventPayloadSchemas = z.union([
  _emailSentWebhookSchema,
  _emailDeliveredWebhookSchema,
  _emailDelayedWebhookSchema,
  _emailMarkedAsSpamWebhookSchema,
  _emailBouncedWebhookSchema,
  _emailOpenedWebhookSchema,
  _emailLinkClickedWebhookSchema,
  _emailFailedToSendWebhookSchema,
])
