import { z } from '@botpress/sdk'
import { ActionDef } from './interfaces'

const messagePartHeaderSchema = z.object({
  name: z.string().nullable().optional().title('Name').describe('The name of the header before the `:` separator.'),
  value: z.string().nullable().optional().title('Value').describe('The value of the header after the `:` separator.'),
})

const messagePartBodySchema = z.object({
  attachmentId: z
    .string()
    .nullable()
    .optional()
    .title('Attachment ID')
    .describe(
      'When present, contains the ID of an external attachment that can be retrieved in a separate `messages.attachments.get` request.'
    ),
  data: z
    .string()
    .nullable()
    .optional()
    .title('Data')
    .describe(
      'The body data of a MIME message part as a base64url encoded string. May be empty for MIME container types that have no message body or when the body data is sent as a separate attachment.'
    ),
  size: z
    .number()
    .nullable()
    .optional()
    .title('Size')
    .describe('Number of bytes for the message part data (encoding notwithstanding).'),
})

const messagePartSchema: any = z.object({
  body: messagePartBodySchema.optional().title('Body').describe('The message part body for this part.'),
  filename: z
    .string()
    .nullable()
    .optional()
    .title('Filename')
    .describe('The filename of the attachment. Only present if this message part represents an attachment.'),
  headers: z
    .array(messagePartHeaderSchema)
    .optional()
    .title('Headers')
    .describe(
      'List of headers on this message part. For the top-level message part, representing the entire message payload, it will contain the standard RFC 2822 email headers such as `To`, `From`, and `Subject`.'
    ),
  mimeType: z.string().nullable().optional().title('MIME Type').describe('The MIME type of the message part.'),
  partId: z.string().nullable().optional().title('Part ID').describe('The immutable ID of the message part.'),
})

export const getMessage = {
  title: 'Get Message',
  description: 'Gets a message by its ID.',
  input: {
    schema: z.object({
      id: z.string().title('Message ID').describe('The ID of the message to get.'),
    }),
  },
  output: {
    schema: z.object({
      message: z.object({
        historyId: z
          .string()
          .nullable()
          .optional()
          .title('History ID')
          .describe('The ID of the last history record that modified this message.'),
        id: z.string().title('Message ID').describe('The immutable ID of the message.'),
        internalDate: z
          .string()
          .nullable()
          .optional()
          .title('Internal Date')
          .describe(
            'The internal message creation timestamp (epoch ms), which determines ordering in the inbox. For normal SMTP-received email, this represents the time the message was originally accepted by Google, which is more reliable than the `Date` header. However, for API-migrated mail, it can be configured by client to be based on the `Date` header.'
          ),
        labelIds: z
          .array(z.string())
          .nullable()
          .optional()
          .title('Label IDs')
          .describe('List of IDs of labels applied to this message.'),
        payload: messagePartSchema
          .optional()
          .title('Payload')
          .describe('The parsed email structure in the message parts.'),
        raw: z
          .string()
          .nullable()
          .optional()
          .title('Raw')
          .describe(
            'The entire email message in an RFC 2822 formatted and base64url encoded string. Returned in `messages.get` and `drafts.get` responses when the `format=RAW` parameter is supplied.'
          ),
        sizeEstimate: z
          .number()
          .nullable()
          .optional()
          .title('Size Estimate')
          .describe('Estimated size in bytes of the message.'),
        snippet: z.string().nullable().optional().title('Snippet').describe('A short part of the message text.'),
        threadId: z
          .string()
          .nullable()
          .optional()
          .title('Thread ID')
          .describe(
            'The ID of the thread the message belongs to. To add a message or draft to a thread, the following criteria must be met: 1. The requested `threadId` must be specified on the `Message` or `Draft.Message` you supply with your request. 2. The `References` and `In-Reply-To` headers must be set in compliance with the [RFC 2822](https://tools.ietf.org/html/rfc2822) standard. 3. The `Subject` headers must match.'
          ),
      }),
    }),
  },
} as const satisfies ActionDef
