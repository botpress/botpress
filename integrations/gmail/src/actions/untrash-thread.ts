import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const untrashThread = wrapAction(
  { actionName: 'untrashThread', errorMessageWhenFailed: 'Failed to untrash thread' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { id }: { id: string }
  ) => {
    await googleClient.threads.untrash(id)

    return {}
  }
)
