import { z } from '@botpress/sdk'
import { notificationPolicySchema } from '../notification-schemas'
import { ActionDef } from './types'

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
