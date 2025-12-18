import { z } from '@botpress/sdk'
import { attachmentSchema } from './get-message-attachment'
import { ActionDef } from './types'

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
      attachment: attachmentSchema,
    }),
  },
} as const satisfies ActionDef
