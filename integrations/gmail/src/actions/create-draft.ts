import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const createDraft = wrapAction(
  { actionName: 'createDraft', errorMessageWhenFailed: 'Failed to create draft' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { to, subject, body }: { to: string; subject: string; body: string }
  ) => {
    const raw = await googleClient.messages.composeRaw(to, subject, body)
    const result = await googleClient.drafts.create(raw)

    return {
      id: result.id ?? undefined,
      message: result.message
        ? {
            id: result.message.id ?? undefined,
            threadId: result.message.threadId ?? undefined,
          }
        : undefined,
    }
  }
)
