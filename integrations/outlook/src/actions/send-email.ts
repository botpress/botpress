import type { Implementation } from '../misc/types'

import { sendEmailInputSchema } from '../misc/custom-schemas'

import { getClient } from '../utils'

export const sendEmail: Implementation['actions']['sendEmail'] = async ({
  ctx,
  input,
}) => {
  const validatedInput = sendEmailInputSchema.parse(input)
  const graphClient = getClient(ctx.configuration)
  const mail = {
    subject: validatedInput.subject,
    type: validatedInput.type,
    body: validatedInput.body,
    toRecipients: validatedInput.toRecipients,
    ccRecipients: validatedInput.ccRecipients,
  }
  const response = await graphClient.sendEmail(mail)
  return { id: response?.id }
}
