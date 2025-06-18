import { z } from '@botpress/sdk'
import { EMAIL_ADDRESS_DESCRIPTION, EmailAddressSchema, NonBlankString } from './common'

export const EmailDataSchema = z
  .object({
    name: NonBlankString.optional().describe('The name of the correspondent (e.g. "John" or "John Doe")'),
    email: EmailAddressSchema,
  })
  .or(EmailAddressSchema)

/** The common send email input schema which will be exposed to users in Botpress Studio */
export const sendMailInputSchema = z.object({
  to: EmailDataSchema.describe(EMAIL_ADDRESS_DESCRIPTION).title('Email Recipient'),
  from: EmailDataSchema.describe(EMAIL_ADDRESS_DESCRIPTION).title('Email Sender'),
  subject: NonBlankString.describe('The subject of the email (e.g. How to build a bot with Botpress!)').title(
    'Email Subject'
  ),
  body: NonBlankString.describe('The plain text body of the email').title('Email Body'), // TODO: Think of an example to place here
  replyTo: EmailDataSchema.describe(EMAIL_ADDRESS_DESCRIPTION).title('Reply To').optional(),
})

/** The response schema for SendGrid's send email endpoint for successful requests. */
export const sendEmailOutputSchema = z.object({
  /** This only contains the status code because in the current SendGrid
   *  API version the response body is empty when the request is successful.
   *
   *  Observed: 2025-06-18 */
  status: z.number().min(1),
})
