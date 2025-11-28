import { z } from '@botpress/sdk'
import { ActionDef } from './interfaces'

export const composeRawEmail = {
  title: 'Compose Raw Email',
  description:
    'Composes a raw email message in RFC 2822 format, base64url encoded. The result can be used with the sendMail action to send the email.',
  input: {
    schema: z.object({
      to: z.string().title('To').describe('The email address of the recipient.'),
      subject: z.string().title('Subject').describe('The subject of the email.'),
      body: z.string().title('Body').describe('The body content of the email (will be used for both text and HTML).'),
    }),
  },
  output: {
    schema: z.object({
      raw: z
        .string()
        .title('Raw Email')
        .describe('The entire email message in an RFC 2822 formatted and base64url encoded string.'),
    }),
  },
} as const satisfies ActionDef
