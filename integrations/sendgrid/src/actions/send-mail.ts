import { RuntimeError } from '@botpress/sdk'
import sgMail from '@sendgrid/mail'
import { markdownToHtml } from '../misc/markdown-utils'
import { parseError } from '../misc/utils'
import * as bp from '.botpress'

export const sendMail: bp.IntegrationProps['actions']['sendMail'] = async ({ ctx, input, logger }) => {
  try {
    const [response] = await sgMail.send({
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

    if (response.statusCode < 200 && response.statusCode >= 300) {
      // noinspection ExceptionCaughtLocallyJS
      throw new RuntimeError('Failed to send email.')
    }

    return {}
  } catch (thrown: unknown) {
    const error = parseError(ctx, thrown)
    logger.forBot().error('Failed to send email', error)
    throw error
  }
}
