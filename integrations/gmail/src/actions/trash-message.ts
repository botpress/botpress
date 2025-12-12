import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const trashMessage = wrapAction(
  { actionName: 'trashMessage', errorMessageWhenFailed: 'Failed to trash message' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { id }: { id: string }
  ) => {
    await googleClient.messages.trash(id)

    return {}
  }
)
