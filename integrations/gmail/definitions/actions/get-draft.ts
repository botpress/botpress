import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const getDraft = {
  title: 'Get Draft',
  description: 'Gets the specified draft by its ID.',
  input: {
    schema: z.object({
      id: z.string().title('Draft ID').describe('The ID of the draft to retrieve.'),
    }),
  },
  output: {
    schema: z.object({
      id: z.string().optional().title('Draft ID').describe('The immutable ID of the draft.'),
      message: z
        .object({
          id: z.string().optional().describe('The ID of the message.'),
          threadId: z.string().optional().describe('The ID of the thread.'),
          labelIds: z.array(z.string()).optional().describe('List of label IDs applied to the draft message.'),
          snippet: z.string().optional().describe('A short part of the message text.'),
        })
        .optional()
        .title('Message')
        .describe('The message content of the draft.'),
    }),
  },
} as const satisfies ActionDef
