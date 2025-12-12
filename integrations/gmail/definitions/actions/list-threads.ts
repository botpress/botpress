import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listThreads = {
  title: 'List Threads',
  description: "Lists all email threads in the user's mailbox.",
  input: {
    schema: z.object({}),
  },
  output: {
    schema: z.object({
      threads: z
        .array(
          z.object({
            id: z.string().optional().describe('The unique ID of the thread.'),
            snippet: z.string().optional().describe('A short part of the message text.'),
            historyId: z.string().optional().describe('The history ID of the thread.'),
          })
        )
        .optional()
        .title('Threads')
        .describe('List of threads in the mailbox.'),
      resultSizeEstimate: z
        .number()
        .optional()
        .title('Result Size Estimate')
        .describe('Estimated total number of results.'),
    }),
  },
} as const satisfies ActionDef
