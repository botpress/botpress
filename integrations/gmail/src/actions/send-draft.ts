import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const sendDraft = wrapAction(
  { actionName: 'sendDraft', errorMessageWhenFailed: 'Failed to send draft' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { id }: { id: string }
  ) => {
    const result = await googleClient.drafts.send(id)

    return {
      id: result.id ?? undefined,
      threadId: result.threadId ?? undefined,
      labelIds: result.labelIds ?? undefined,
    }
  }
)
