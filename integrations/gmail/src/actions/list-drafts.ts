import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const listDrafts = wrapAction(
  { actionName: 'listDrafts', errorMessageWhenFailed: 'Failed to list drafts' },
  async ({ googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> }) => {
    const result = await googleClient.drafts.list()

    return {
      drafts: result.drafts?.map((draft) => ({
        id: draft.id ?? undefined,
        message: draft.message
          ? {
              id: draft.message.id ?? undefined,
              threadId: draft.message.threadId ?? undefined,
            }
          : undefined,
      })),
      resultSizeEstimate: result.resultSizeEstimate ?? undefined,
    }
  }
)
