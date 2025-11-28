import { z } from '@botpress/sdk'
import { ActionDef } from './interfaces'

export const sendMail = {
  title: 'Send Mail',
  description:
    'Sends a message. The message must be provided as a base64url encoded string in RFC 2822 format. Optionally, a thread ID can be provided to send the message as a reply.',
  input: {
    schema: z.object({
      raw: z
        .string()
        .title('Raw Message')
        .describe(
          'The entire email message in an RFC 2822 formatted and base64url encoded string. Use composeRawEmail utility to generate this.'
        ),
      threadId: z
        .string()
        .optional()
        .title('Thread ID')
        .describe('The ID of the thread the message belongs to. Used to send a reply in an existing conversation.'),
    }),
  },
  output: {
    schema: z.object({
      id: z.string().nullable().optional().title('Message ID').describe('The ID of the sent message.'),
      threadId: z
        .string()
        .nullable()
        .optional()
        .title('Thread ID')
        .describe('The ID of the thread the message belongs to.'),
      labelIds: z
        .array(z.string())
        .nullable()
        .optional()
        .title('Label IDs')
        .describe('List of IDs of labels applied to this message.'),
    }),
  },
} as const satisfies ActionDef
