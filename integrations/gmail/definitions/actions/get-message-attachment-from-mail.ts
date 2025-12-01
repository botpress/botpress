import { z } from '@botpress/sdk'
import { ActionDef } from './interfaces'

export const getMessageAttachmentFromMail = {
  title: 'Get Message Attachment From Mail',
  description: 'Gets the first attachment from a message by automatically finding the attachment ID from the message.',
  input: {
    schema: z.object({
      messageId: z.string().title('Message ID').describe('The ID of the message containing the attachment.'),
    }),
  },
  output: {
    schema: z.object({
      attachment: z.object({
        size: z.number().nullable().optional().title('Size').describe('The size of the attachment in bytes.'),
        data: z
          .string()
          .nullable()
          .optional()
          .title('Data')
          .describe('The body data of a MIME message part as a base64url encoded string.'),
        attachmentId: z
          .string()
          .nullable()
          .optional()
          .title('Attachment ID')
          .describe('The immutable ID of the attachment.'),
      }),
    }),
  },
} as const satisfies ActionDef
