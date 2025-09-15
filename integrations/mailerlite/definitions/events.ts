import { EventDefinition } from '@botpress/sdk'
import { subscriberSchema, webhookSchema } from './schemas'

const subscriberCreated = {
  title: 'Subscriber Created',
  description: 'A new subscriber has been created in MailerLite',
  schema: subscriberSchema,
}

const campaignSent = {
  title: 'Campaign Sent',
  description: 'A campaign has been sent in MailerLite',
  schema: webhookSchema,
}

export const events = {
  subscriberCreated,
  campaignSent,
} as const satisfies Record<string, EventDefinition>
