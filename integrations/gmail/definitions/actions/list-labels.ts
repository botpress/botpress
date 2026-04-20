import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listLabels = {
  title: 'List Labels',
  description: "Lists all labels in the user's mailbox, including system labels and user-created labels.",
  input: {
    schema: z.object({}),
  },
  output: {
    schema: z.object({
      labels: z
        .array(
          z.object({
            id: z.string().optional().describe('The immutable ID of the label.'),
            name: z.string().optional().describe('The display name of the label.'),
            type: z.string().optional().describe('The owner type for the label (system or user).'),
          })
        )
        .optional()
        .title('Labels')
        .describe('List of labels.'),
    }),
  },
} as const satisfies ActionDef
