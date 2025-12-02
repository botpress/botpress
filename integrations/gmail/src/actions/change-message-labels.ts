import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const changeMessageLabels = wrapAction(
  { actionName: 'changeMessageLabels', errorMessageWhenFailed: 'Failed to change message labels' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { id, addLabelIds, removeLabelIds }: { id: string; addLabelIds?: string[]; removeLabelIds?: string[] }
  ) => {
    await googleClient.messages.modifyLabels(id, addLabelIds, removeLabelIds)

    return {}
  }
)
