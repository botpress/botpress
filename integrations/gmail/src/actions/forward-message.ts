import { GoogleClient } from '../google-api/google-client'
import { composeRawEmail } from '../utils/mail-composing'
import { wrapAction } from './action-wrapper'

export const forwardMessage = wrapAction(
  { actionName: 'forwardMessage', errorMessageWhenFailed: 'Failed to forward message' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { to, subject, body }: { to: string; subject: string; body: string }
  ) => {
    const raw = await composeRawEmail({
      to,
      subject,
      text: body,
      html: body,
      textEncoding: 'base64',
    })

    const result = await googleClient.sendMail(raw)

    return {
      id: result.id ?? null,
      threadId: result.threadId ?? null,
      labelIds: result.labelIds ?? null,
    }
  }
)
