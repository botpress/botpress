import { EventDefinition, IntegrationDefinitionProps } from '@botpress/sdk'
import { campaignOrLoopEmailEventSchema, fullEmailEventSchema } from './schemas'

const emailDelivered = {
  title: 'Email Delivered',
  description: 'Sent when an email is delivered to its recipient.',
  schema: fullEmailEventSchema,
} as const satisfies EventDefinition

const emailSoftBounced = {
  title: 'Email Soft Bounced',
  description:
    'Sent when an email soft bounces. Soft bounces are temporary email delivery failures, for example a connection timing out. Soft bounces are retried multiple times and some times the email is delivered.',
  schema: fullEmailEventSchema,
} as const satisfies EventDefinition

const emailHardBounced = {
  title: 'Email Hard Bounced',
  description:
    "Sent when an email hard bounces. Hard bounces are persistent email delivery failures, for example a mailbox that doesn't exist. The email will not be delivered.",
  schema: fullEmailEventSchema,
} as const satisfies EventDefinition

const emailOpened = {
  title: 'Email Opened',
  description:
    'Sent when a campaign or loop email is opened. This event is not available for transactional emails because email opens are not tracked for transactional emails.',
  schema: campaignOrLoopEmailEventSchema,
} as const satisfies EventDefinition

const emailClicked = {
  title: 'Email Clicked',
  description:
    'Sent when a link in a campaign or loop email is clicked. This event is not available for transactional emails because link clicks are not tracked in transactional emails.',
  schema: campaignOrLoopEmailEventSchema,
} as const satisfies EventDefinition

const emailUnsubscribed = {
  title: 'Email Unsubscribed',
  description:
    'Sent when a recipient unsubscribes via the unsubscribe link in an email. This event is not available for transactional emails because unsubscribe links are not included or required for transactional emails.',
  schema: campaignOrLoopEmailEventSchema,
} as const satisfies EventDefinition

const emailSpamReported = {
  title: 'Email Spam Reported',
  description: 'Sent when a recipient reports your email as spam.',
  schema: fullEmailEventSchema,
} as const satisfies EventDefinition

export const events = {
  emailDelivered,
  emailSoftBounced,
  emailHardBounced,
  emailOpened,
  emailClicked,
  emailUnsubscribed,
  emailSpamReported,
} as const satisfies IntegrationDefinitionProps['events']
