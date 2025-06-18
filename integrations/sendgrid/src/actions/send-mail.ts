import { input } from '@botpress/sdk'
import sgMail from '@sendgrid/mail'
import { sendMailInputSchema } from '../misc/custom-schemas'
import { parseError } from '../misc/utils'
import * as bp from '.botpress'

export const sendMail: bp.IntegrationProps['actions']['sendMail'] = async ({ input, logger }) => {
  try {
    const requestBody = mapInputToSendMailRequestBody(input)
    const [response, _] = await sgMail.send(requestBody)

    return {
      status: response.statusCode,
    }
  } catch (thrown: unknown) {
    const error = parseError(thrown)
    logger.forBot().error('Failed to send email', error)
    throw error
  }
}

/** Takes the sendMailInputSchema data and transforms it into a format that SendGrid will accept.
 *
 * @remark The goal of this is to have a common input schema between each of the
 *  email integrations while handling what to send to each email API internally
 *  (avoiding vendor lock-in). */
const mapInputToSendMailRequestBody = (input: input<typeof sendMailInputSchema>) => {
  return {
    personalizations: [
      {
        to: input.to,
      },
    ],
    from: input.from,
    replyTo: input.replyTo,
    subject: input.subject,
    text: input.body,
  }
}
