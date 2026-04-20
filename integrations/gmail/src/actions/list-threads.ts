import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const listThreads = wrapAction(
  { actionName: 'listThreads', errorMessageWhenFailed: 'Failed to list threads' },
  async ({ googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> }) => {
    const result = await googleClient.threads.list()

    return {
      threads: result.threads?.map((thread) => ({
        id: thread.id ?? undefined,
        snippet: thread.snippet ?? undefined,
        historyId: thread.historyId ?? undefined,
      })),
      resultSizeEstimate: result.resultSizeEstimate ?? undefined,
    }
  }
)
