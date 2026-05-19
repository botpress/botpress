import { z } from '@botpress/sdk'
import { matcherSchema, notificationPolicySchema } from '../notification-schemas'
import { ActionDef } from './types'

export const editNotificationPolicy = {
  title: 'Edit Notification Policy',
  description: 'Edit an existing notification policy identified by receiver and matchers',
  input: {
    schema: z.object({
      receiver: z
        .string()
        .min(1, 'Receiver name is required to identify the policy')
        .title('Receiver')
        .describe('Contact point name that identifies the policy to edit'),
      matchers: z
        .array(matcherSchema)
        .min(1, 'At least one matcher is required to identify the policy')
        .title('Matchers')
        .describe('Label matchers that identify the exact policy route to edit'),
      updates: notificationPolicySchema
        .partial()
        .title('Updates')
        .describe('Fields to update on the notification policy'),
    }),
  },
  output: { schema: z.object({}) },
} satisfies ActionDef
