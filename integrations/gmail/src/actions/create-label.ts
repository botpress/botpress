import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const createLabel = wrapAction(
  { actionName: 'createLabel', errorMessageWhenFailed: 'Failed to create label' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { name }: { name: string }
  ) => {
    const result = await googleClient.labels.create(name)

    return {
      id: result.id ?? undefined,
      name: result.name ?? undefined,
      type: result.type ?? undefined,
    }
  }
)
