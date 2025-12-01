import { z } from '@botpress/sdk'
import { ActionDef } from './interfaces'

export const forwardMessage = {
  title: 'Forward Message',
  description: 'Forwards a message by sending a new email with the specified subject and body to the recipient.',
  input: {
    schema: z.object({
      to: z.string().title('To').describe('The email address of the recipient.'),
      subject: z.string().title('Subject').describe('The subject of the forwarded message.'),
      body: z.string().title('Body').describe('The body content of the forwarded message.'),
    }),
  },
  output: {
    schema: z.object({
      id: z.union([z.string(), z.null()]).optional().title('Message ID').describe('The ID of the sent message.'),
      threadId: z
        .union([z.string(), z.null()])
        .optional()
        .title('Thread ID')
        .describe('The ID of the thread the message belongs to.'),
      labelIds: z
        .union([z.array(z.string()), z.null()])
        .optional()
        .title('Label IDs')
        .describe('List of IDs of labels applied to this message.'),
    }),
  },
} as const satisfies ActionDef
