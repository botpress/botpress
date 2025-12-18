import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const deleteLabel = wrapAction(
  { actionName: 'deleteLabel', errorMessageWhenFailed: 'Failed to delete label' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { id }: { id: string }
  ) => {
    await googleClient.labels.delete(id)

    return {}
  }
)
