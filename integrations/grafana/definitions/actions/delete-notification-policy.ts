import { z } from '@botpress/sdk'
import { ActionDef } from './types'
import { matcherSchema } from '../notification-schemas'

export const deleteNotificationPolicy = {
  title: 'Delete Notification Policy',
  description: 'Delete a specific notification policy route by receiver and matchers',
  input: {
    schema: z.object({
      receiver: z.string().min(1, 'Receiver name is required'),
      matchers: z.array(matcherSchema).min(1, 'At least one matcher is required to identify the policy'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
