import { z } from '@botpress/sdk'
import { EMAIL_ADDRESS_DESCRIPTION, EmailAddressSchema, NonBlankString } from './common'

/** The common send email input schema which will be exposed to users in Botpress Studio */
export const sendMailInputSchema = z.object({
  from: EmailAddressSchema.title('Email Sender').describe(EMAIL_ADDRESS_DESCRIPTION),
  to: EmailAddressSchema.title('Email Recipient').describe(EMAIL_ADDRESS_DESCRIPTION),
  cc: z.array(EmailAddressSchema).optional().title('Carbon Copy').describe('List of carbon copy recipients'),
  bcc: z
    .array(EmailAddressSchema)
    .optional()
    .title('Blind Carbon Copy')
    .describe('List of blind carbon copy recipients'),
  subject: NonBlankString.title('Email Subject').describe(
    'The subject of the email (e.g. How to build a bot with Botpress!)'
  ),
  body: NonBlankString.title('Email Body').describe('The markdown rich-text body of the email'),
  replyTo: EmailAddressSchema.optional().title('Reply To').describe(EMAIL_ADDRESS_DESCRIPTION),
})

/** The response schema for Resend's send email endpoint for successful requests. */
export const sendEmailOutputSchema = z.object({
  emailId: NonBlankString.or(z.null()).title('Email ID').describe('The id of a successfully sent email'),
})
