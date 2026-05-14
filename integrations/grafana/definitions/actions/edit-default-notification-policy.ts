import { z } from '@botpress/sdk'
import { ActionDef } from './types'
import { notificationPolicySchema } from '../notification-schemas'

export const editDefaultNotificationPolicy = {
  title: 'Edit Default Notification Policy',
  description: 'Edit the root notification policy (catches all alerts not matched by a child route)',
  input: {
    schema: notificationPolicySchema.omit({ matchers: true }).partial(),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
