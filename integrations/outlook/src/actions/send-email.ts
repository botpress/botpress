import type { sendEmailAction } from '../misc/types'

import { sendEmailInputSchema } from '../misc/custom-schemas'
import { getClient } from '../utils'

export const sendEmail: sendEmailAction = async ({ ctx, input, logger }) => {
  const validatedInput = sendEmailInputSchema.parse(input)
  try {
    const graphClient = getClient(ctx.configuration)
    const mail = {
      subject: validatedInput.subject,
      type: validatedInput.type,
      body: validatedInput.body,
      toRecipients: validatedInput.toRecipients,
      ccRecipients: validatedInput.ccRecipients,
      bccRecipients: validatedInput.bccRecipients,
    }
    await graphClient.sendEmail({ ctx, ...mail })
    logger
      .forBot()
      .info(
        `Successful - Send Email ${validatedInput.subject} to ${validatedInput.toRecipients}`
      )
  } catch (error) {
    logger.forBot().debug(`'Send Email' exception ${JSON.stringify(error)}`)
  }
  return {}
}
