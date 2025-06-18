import sgMail from '@sendgrid/mail'
import { sendEmailOutputSchema, sendMailForSendGridInputSchema } from '../misc/custom-schemas'
import { parseError } from '../misc/utils'
import { validateData } from '../misc/validation-utils'
import * as bp from '.botpress'

export const sendMail: bp.IntegrationProps['actions']['sendMail'] = async ({ input, logger }) => {
  const result = validateData(sendMailForSendGridInputSchema, input)

  if (!result.isSuccess) {
    logger.forBot().error('Cannot send email due to invalid input data', result.error)
    throw result.error
  }

  const validatedInput = result.data

  try {
    const [response, _] = await sgMail.send(validatedInput)

    return sendEmailOutputSchema.parse({
      status: response.statusCode,
    })
  } catch (thrown: unknown) {
    const error = parseError(thrown)
    logger.forBot().error('Failed to send email', error)
    throw error
  }
}
