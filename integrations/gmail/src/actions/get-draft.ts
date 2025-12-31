import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const getDraft = wrapAction(
  { actionName: 'getDraft', errorMessageWhenFailed: 'Failed to get draft' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { id }: { id: string }
  ) => {
    const result = await googleClient.drafts.get(id)

    return {
      id: result.id ?? undefined,
      message: result.message
        ? {
            id: result.message.id ?? undefined,
            threadId: result.message.threadId ?? undefined,
            labelIds: result.message.labelIds ?? undefined,
            snippet: result.message.snippet ?? undefined,
          }
        : undefined,
    }
  }
)
