import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listDrafts = {
  title: 'List Drafts',
  description: "Lists all drafts in the user's mailbox.",
  input: {
    schema: z.object({}),
  },
  output: {
    schema: z.object({
      drafts: z
        .array(
          z.object({
            id: z.string().optional().describe('The immutable ID of the draft.'),
            message: z
              .object({
                id: z.string().optional().describe('The ID of the message contained in the draft.'),
                threadId: z.string().optional().describe('The ID of the thread the draft belongs to.'),
              })
              .optional()
              .describe('The message content of the draft.'),
          })
        )
        .optional()
        .title('Drafts')
        .describe('List of drafts.'),
      resultSizeEstimate: z
        .number()
        .optional()
        .title('Result Size Estimate')
        .describe('Estimated total number of results.'),
    }),
  },
} as const satisfies ActionDef
