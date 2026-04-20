import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const getThread = {
  title: 'Get Thread',
  description: 'Gets the specified thread by its ID, including all messages in the thread.',
  input: {
    schema: z.object({
      id: z.string().title('Thread ID').describe('The ID of the thread to retrieve.'),
    }),
  },
  output: {
    schema: z.object({
      id: z.string().optional().title('Thread ID').describe('The unique ID of the thread.'),
      snippet: z.string().optional().title('Snippet').describe('A short part of the message text.'),
      historyId: z.string().optional().title('History ID').describe('The history ID of the thread.'),
      messages: z
        .array(
          z.object({
            id: z.string().optional().describe('The ID of the message.'),
            threadId: z.string().optional().describe('The ID of the thread the message belongs to.'),
            labelIds: z.array(z.string()).optional().describe('List of label IDs applied to this message.'),
            snippet: z.string().optional().describe('A short part of the message text.'),
          })
        )
        .optional()
        .title('Messages')
        .describe('The list of messages in the thread.'),
    }),
  },
} as const satisfies ActionDef
