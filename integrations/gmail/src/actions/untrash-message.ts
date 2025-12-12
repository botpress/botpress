import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const untrashMessage = wrapAction(
  { actionName: 'untrashMessage', errorMessageWhenFailed: 'Failed to untrash message' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { id }: { id: string }
  ) => {
    await googleClient.messages.untrash(id)

    return {}
  }
)
