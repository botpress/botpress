import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const attachmentSchema = z
  .object({
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
  })
  .title('Attachment')
  .describe('The attachment retrieved from the message.')

export const getMessageAttachment = {
  title: 'Get Message Attachment',
  description: 'Gets the specified message attachment by its ID.',
  input: {
    schema: z.object({
      messageId: z.string().title('Message ID').describe('The ID of the message containing the attachment.'),
      attachmentId: z.string().title('Attachment ID').describe('The ID of the attachment to retrieve.'),
    }),
  },
  output: {
    schema: z.object({
      attachment: attachmentSchema,
    }),
  },
} as const satisfies ActionDef
