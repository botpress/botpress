import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const deleteMessage = wrapAction(
  { actionName: 'deleteMessage', errorMessageWhenFailed: 'Failed to delete message' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { id }: { id: string }
  ) => {
    const result = await googleClient.messages.delete(id)

    return {
      result,
    }
  }
)
