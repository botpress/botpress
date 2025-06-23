import { z } from '@botpress/sdk'
import { EMAIL_ADDRESS_DESCRIPTION, EmailAddressSchema, NonBlankString, StatusCodeSchema } from './common'

/** The common send email input schema which will be exposed to users in Botpress Studio */
export const sendMailInputSchema = z.object({
  to: EmailAddressSchema.describe(EMAIL_ADDRESS_DESCRIPTION).title('Email Recipient'),
  from: EmailAddressSchema.describe(EMAIL_ADDRESS_DESCRIPTION).title('Email Sender'),
  subject: NonBlankString.describe('The subject of the email (e.g. How to build a bot with Botpress!)').title(
    'Email Subject'
  ),
  body: NonBlankString.describe('The plain text body of the email').title('Email Body'), // TODO: Think of an example to place here
  replyTo: EmailAddressSchema.describe(EMAIL_ADDRESS_DESCRIPTION).title('Reply To').optional(),
})

const resendErrorSchema = z.object({
  message: NonBlankString.describe('A short description of what triggered the error'),
  name: NonBlankString.describe('An identifier key for the Resend API error'),
})

/** The response schema for Resend's send email endpoint for successful requests. */
export const sendEmailOutputSchema = z.object({
  status: StatusCodeSchema.describe('The http status code & reason phrase').title('Request Status Info'),
  emailId: NonBlankString.or(z.null()).describe('The id of a successfully sent email').title('Email ID'),
  error: resendErrorSchema
    .or(z.null())
    .describe('The error response that Resend returns if a request fails')
    .title('Error Details'),
})
