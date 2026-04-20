import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const sendDraft = {
  title: 'Send Draft',
  description: 'Sends the specified draft. The draft will be deleted after being sent.',
  input: {
    schema: z.object({
      id: z.string().title('Draft ID').describe('The ID of the draft to send.'),
    }),
  },
  output: {
    schema: z.object({
      id: z.string().optional().title('Message ID').describe('The ID of the sent message.'),
      threadId: z.string().optional().title('Thread ID').describe('The ID of the thread the message belongs to.'),
      labelIds: z
        .array(z.string())
        .optional()
        .title('Label IDs')
        .describe('List of label IDs applied to the sent message.'),
    }),
  },
} as const satisfies ActionDef
