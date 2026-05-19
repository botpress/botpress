import { z } from '@botpress/sdk'
import { notificationPolicySchema } from '../notification-schemas'
import { ActionDef } from './types'

export const createNotificationPolicy = {
  title: 'Create Notification Policy',
  description: 'Add a notification policy routing alerts to a contact point',
  input: { schema: notificationPolicySchema },
  output: { schema: z.object({}) },
} satisfies ActionDef
