import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const updateDraft = wrapAction(
  { actionName: 'updateDraft', errorMessageWhenFailed: 'Failed to update draft' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { id, to, subject, body }: { id: string; to: string; subject: string; body: string }
  ) => {
    const raw = await googleClient.messages.composeRaw(to, subject, body)
    const result = await googleClient.drafts.update(id, raw)

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
