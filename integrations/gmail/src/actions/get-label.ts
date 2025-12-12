import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const getLabel = wrapAction(
  { actionName: 'getLabel', errorMessageWhenFailed: 'Failed to get label' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { id }: { id: string }
  ) => {
    const result = await googleClient.labels.get(id)

    return {
      id: result.id ?? undefined,
      name: result.name ?? undefined,
      type: result.type ?? undefined,
      messageListVisibility: result.messageListVisibility ?? undefined,
      labelListVisibility: result.labelListVisibility ?? undefined,
      messagesTotal: result.messagesTotal ?? undefined,
      messagesUnread: result.messagesUnread ?? undefined,
      threadsTotal: result.threadsTotal ?? undefined,
      threadsUnread: result.threadsUnread ?? undefined,
      color: result.color
        ? {
            backgroundColor: result.color.backgroundColor ?? undefined,
            textColor: result.color.textColor ?? undefined,
          }
        : undefined,
    }
  }
)
