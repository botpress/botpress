import { EventDefinition } from '@botpress/sdk'
import { subscriberSchema } from './schemas'

const subscriberCreated = {
  title: 'Subscriber Created',
  description: 'A new subscriber has been created in MailerLite',
  schema: subscriberSchema,
}

export const events = {
  subscriberCreated,
} as const satisfies Record<string, EventDefinition>
