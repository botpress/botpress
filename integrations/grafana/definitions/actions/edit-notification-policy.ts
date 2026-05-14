import { z } from '@botpress/sdk'
import { ActionDef } from './types'
import { matcherSchema, notificationPolicySchema } from '../notification-schemas'

export const editNotificationPolicy = {
  title: 'Edit Notification Policy',
  description: 'Edit an existing notification policy identified by receiver and matchers',
  input: {
    schema: z.object({
      receiver: z.string().min(1, 'Receiver name is required to identify the policy'),
      matchers: z.array(matcherSchema).min(1, 'At least one matcher is required to identify the policy'),
      updates: notificationPolicySchema.partial(),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
