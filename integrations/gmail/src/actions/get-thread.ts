import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const getThread = wrapAction(
  { actionName: 'getThread', errorMessageWhenFailed: 'Failed to get thread' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { id }: { id: string }
  ) => {
    const result = await googleClient.threads.get(id)

    return {
      id: result.id ?? undefined,
      snippet: result.snippet ?? undefined,
      historyId: result.historyId ?? undefined,
      messages: result.messages?.map((message) => ({
        id: message.id ?? undefined,
        threadId: message.threadId ?? undefined,
        labelIds: message.labelIds ?? undefined,
        snippet: message.snippet ?? undefined,
      })),
    }
  }
)
