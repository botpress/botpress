import { RuntimeError } from '@botpress/sdk'
import { markdownToHtml } from '../misc/markdown-utils'
import { SendGridClient } from '../misc/sendgrid-api'
import { parseError } from '../misc/utils'
import * as bp from '.botpress'

export const sendMail: bp.IntegrationProps['actions']['sendMail'] = async ({ ctx, input, logger }) => {
  try {
    const httpClient = new SendGridClient(ctx.configuration.apiKey)
    const response = await httpClient.sendMail({
      personalizations: [
        {
          to: input.to,
        },
      ],
      from: input.from,
      cc: input.cc,
      bcc: input.bcc,
      replyTo: input.replyTo,
      subject: input.subject,
      html: markdownToHtml(input.body),
    })

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new RuntimeError('Failed to send email.')
    }

    return {}
  } catch (thrown: unknown) {
    const error = parseError(ctx, thrown)
    logger.forBot().error('Failed to send email', error)
    throw error
  }
}
