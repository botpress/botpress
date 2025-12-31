import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const deleteDraft = wrapAction(
  { actionName: 'deleteDraft', errorMessageWhenFailed: 'Failed to delete draft' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { id }: { id: string }
  ) => {
    await googleClient.drafts.delete(id)

    return {}
  }
)
