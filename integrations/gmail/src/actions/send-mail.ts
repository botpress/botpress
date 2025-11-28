import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const sendMail = wrapAction(
  { actionName: 'sendMail', errorMessageWhenFailed: 'Failed to send email' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { raw, threadId }: { raw: string; threadId?: string }
  ) => {
    const result = await googleClient.sendMail(raw, threadId)

    return {
      id: result.id ?? null,
      threadId: result.threadId ?? null,
      labelIds: result.labelIds ?? null,
    }
  }
)
