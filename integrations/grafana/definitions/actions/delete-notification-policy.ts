import { z } from '@botpress/sdk'
import { matcherSchema } from '../notification-schemas'
import { ActionDef } from './types'

export const deleteNotificationPolicy = {
  title: 'Delete Notification Policy',
  description: 'Delete a specific notification policy route by receiver and matchers',
  input: {
    schema: z.object({
      receiver: z
        .string()
        .min(1, 'Receiver name is required')
        .title('Receiver')
        .describe('Name of the contact point that identifies the policy to delete'),
      matchers: z
        .array(matcherSchema)
        .min(1, 'At least one matcher is required to identify the policy')
        .title('Matchers')
        .describe('Label matchers that identify the exact policy route to delete'),
    }),
  },
  output: { schema: z.object({}) },
} satisfies ActionDef
