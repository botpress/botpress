import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const listMessages = wrapAction(
  { actionName: 'listMessages', errorMessageWhenFailed: 'Failed to list messages' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { query, maxResults, pageToken }
  ) => {
    const result = await googleClient.listMessages({
      query,
      maxResults,
      pageToken,
    })

    return {
      messages: result.messages?.map((msg) => ({
        id: msg.id ?? '',
        threadId: msg.threadId ?? '',
      })),
      nextPageToken: result.nextPageToken ?? undefined,
      resultSizeEstimate: result.resultSizeEstimate ?? undefined,
    }
  }
)
