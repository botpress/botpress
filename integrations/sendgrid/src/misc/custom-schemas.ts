import { z } from '@botpress/sdk'
import { EMAIL_ADDRESS_DESCRIPTION, EmailAddressSchema, NonBlankString } from './common-schemas'

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

/** Takes the sendMailInputSchema and transforms it into a format that SendGrid will accept.
 *
 *  @remark The goal of this is to have a common input schema between each of the
 *   email integrations while handling what to send to each email API internally
 *   (avoiding vendor lock-in).
 *  @remark Alternative name idea: "sendGrid_SendMailInputSchema" */
export const sendMailForSendGridInputSchema = sendMailInputSchema.transform((data) => ({
  personalizations: [
    {
      to: data.to,
    },
  ],
  from: data.from,
  replyTo: data.replyTo,
  subject: data.subject,
  text: data.body,
}))

/** The response schema for SendGrid's send email endpoint for both successful requests.
 *
 *  @remark Alternative name idea: "sendGrid_SendEmailOutputSchema" */
export const sendEmailOutputSchema = z.object({
  /** This only contains the status code because in the current
   *  API version the request body is empty when the request is successful.
   *
   *  Observed: 2025-06-18 */
  status: z.number().min(1),
})
