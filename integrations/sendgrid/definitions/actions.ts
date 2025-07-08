import { z } from '@botpress/sdk'
import { EMAIL_ADDRESS_DESCRIPTION, EmailAddressSchema, NonBlankString } from './common'

/** The common send email input schema which will be exposed to users in Botpress Studio */
export const sendMailInputSchema = z.object({
  to: EmailAddressSchema.describe(EMAIL_ADDRESS_DESCRIPTION).title('Email Recipient'),
  from: EmailAddressSchema.describe(EMAIL_ADDRESS_DESCRIPTION).title('Email Sender'),
  cc: z.array(EmailAddressSchema).optional().describe('List of carbon copy recipients').title('Carbon Copy'),
  bcc: z
    .array(EmailAddressSchema)
    .optional()
    .describe('List of blind carbon copy recipients')
    .title('Blind Carbon Copy'),
  subject: NonBlankString.describe('The subject of the email (e.g. How to build a bot with Botpress!)').title(
    'Email Subject'
  ),
  body: NonBlankString.describe('The markdown rich-text body of the email').title('Email Body'), // TODO: Think of an example to place here
  replyTo: EmailAddressSchema.describe(EMAIL_ADDRESS_DESCRIPTION).title('Reply To').optional(),
})

/** The response schema for SendGrid's send email endpoint for successful requests. */
export const sendEmailOutputSchema = z.object({
  /** The output is empty because in the current SendGrid API
   *  version, nothing is returned when the request is successful.
   *
   *  Observed: 2025-06-24 */
})
