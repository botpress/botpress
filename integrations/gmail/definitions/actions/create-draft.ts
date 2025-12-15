import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const createDraft = {
  title: 'Create Draft',
  description: 'Creates a new draft with the specified email content.',
  input: {
    schema: z.object({
      to: z.string().title('To').describe('The recipient email address.'),
      subject: z.string().title('Subject').describe('The subject of the email.'),
      body: z.string().title('Body').describe('The body content of the email.'),
    }),
  },
  output: {
    schema: z.object({
      id: z.string().optional().title('Draft ID').describe('The immutable ID of the created draft.'),
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
