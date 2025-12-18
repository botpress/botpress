import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const updateDraft = {
  title: 'Update Draft',
  description: "Replaces a draft's content with the new email content provided.",
  input: {
    schema: z.object({
      id: z.string().title('Draft ID').describe('The ID of the draft to update.'),
      to: z.string().title('To').describe('The recipient email address.'),
      subject: z.string().title('Subject').describe('The subject of the email.'),
      body: z.string().title('Body').describe('The body content of the email.'),
    }),
  },
  output: {
    schema: z.object({
      id: z.string().optional().title('Draft ID').describe('The immutable ID of the updated draft.'),
      message: z
        .object({
          id: z.string().optional().describe('The ID of the message.'),
          threadId: z.string().optional().describe('The ID of the thread.'),
        })
        .optional()
        .title('Message')
        .describe('The message content of the draft.'),
    }),
  },
} as const satisfies ActionDef
