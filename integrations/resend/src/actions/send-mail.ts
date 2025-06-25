import { Resend } from 'resend'
import { parseError } from '../misc/utils'
import * as bp from '.botpress'

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

  return {
    emailId: data?.id ?? null,
  }
}
