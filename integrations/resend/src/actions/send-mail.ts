import { Resend } from 'resend'
import { HttpStatus } from '../misc/HttpStatus'
import { formatStatusCode, parseError } from '../misc/utils'
import * as bp from '.botpress'

/** The resend package doesn't provide the status
 *  code if the sendEmail request was successful.
 *
 *  This is the success status code I received
 *  when I tested in Postman. */
const DEFAULT_SUCCESS_STATUS: HttpStatus = HttpStatus.OK as const

export const sendMail: bp.IntegrationProps['actions']['sendMail'] = async ({ ctx, input, logger }) => {
  const client = new Resend(ctx.configuration.apiKey)

  const { data, error: thrown } = await client.emails.send({
    from: input.from,
    to: input.to,
    subject: input.subject,
    text: input.body,
  })

  if (thrown) {
    const error = parseError(thrown)
    logger.forBot().error('Failed to send email', error)
    throw error
  }

  const emailId = data?.id ?? null
  return {
    status: formatStatusCode(emailId ? DEFAULT_SUCCESS_STATUS : HttpStatus.BAD_GATEWAY),
    emailId,
  }
}
