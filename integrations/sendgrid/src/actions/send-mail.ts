import sgMail from '@sendgrid/mail'
import { parseError } from '../misc/utils'
import * as bp from '.botpress'

export const sendMail: bp.IntegrationProps['actions']['sendMail'] = async ({ input, logger }) => {
  try {
    const [response, _] = await sgMail.send({
      // Transforms input schema data into SendGrid
      // request body (To avoid vendor lock-in)
      personalizations: [
        {
          to: input.to,
        },
      ],
      from: input.from,
      replyTo: input.replyTo,
      subject: input.subject,
      text: input.body,
    })

    return {
      status: response.statusCode,
    }
  } catch (thrown: unknown) {
    const error = parseError(thrown)
    logger.forBot().error('Failed to send email', error)
    throw error
  }
}
