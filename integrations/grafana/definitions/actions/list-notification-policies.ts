import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listNotificationPolicies = {
  title: 'List Notification Policies',
  description: 'List all notification policy routes',
  input: { schema: z.object({}) },
  output: {
    schema: z.object({
      policies: z
        .array(
          z.object({
            receiver: z.string().optional().title('Receiver').describe('Contact point this policy routes to'),
            matchers: z.any().optional().title('Matchers').describe('String-format label matchers'),
            object_matchers: z
              .any()
              .optional()
              .title('Object Matchers')
              .describe('Structured label matchers as [name, operator, value] tuples'),
            group_by: z.array(z.string()).optional().title('Group By').describe('Labels used to group alerts'),
            continue: z.boolean().optional().title('Continue').describe('Whether matching continues to sibling routes'),
          })
        )
        .title('Policies')
        .describe('List of notification policy routes'),
    }),
  },
} satisfies ActionDef
