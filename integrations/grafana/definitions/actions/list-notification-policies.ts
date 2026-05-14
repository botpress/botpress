import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listNotificationPolicies = {
  title: 'List Notification Policies',
  description: 'List all notification policy routes',
  input: { schema: z.object({}) },
  output: {
    schema: z.object({
      success: z.boolean(),
      data: z.array(z.object({
        receiver: z.string().optional(),
        matchers: z.any().optional(),
        object_matchers: z.any().optional(),
        group_by: z.array(z.string()).optional(),
        continue: z.boolean().optional(),
      })).optional(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
