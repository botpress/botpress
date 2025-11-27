import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const getMessage = wrapAction(
  { actionName: 'getMessage', errorMessageWhenFailed: 'Failed to get message using its ID' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { id }: { id: string }
  ) => {
    const message = await googleClient.getMessageById(id)

    return {
      message: {
        historyId: message.historyId ?? null,
        id: message.id ?? '',
        internalDate: message.internalDate ?? null,
        labelIds: message.labelIds ?? null,
        payload: message.payload,
        raw: message.raw ?? null,
        sizeEstimate: message.sizeEstimate ?? null,
        snippet: message.snippet ?? null,
        threadId: message.threadId ?? null,
      },
    }
  }
)
