import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const trashThread = wrapAction(
  { actionName: 'trashThread', errorMessageWhenFailed: 'Failed to trash thread' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { id }: { id: string }
  ) => {
    await googleClient.threads.trash(id)

    return {}
  }
)
