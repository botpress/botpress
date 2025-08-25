import { wrapAction } from '../action-wrapper'
import { composeRawEmail } from 'src/utils/mail-composing'

export const sendEmail = wrapAction(
  { actionName: 'sendEmail', errorMessage: 'Failed to send email' },
  async ({ googleClient }, { recipient, subject, body }) => {
    const raw = await composeRawEmail({
      to: recipient,
      subject,
      text: body,
      textEncoding: 'base64',
    })
    console.info('Sending mail', raw)

    const res = await googleClient.sendRawEmail(raw)
    console.info('Response', res)
  }
)
