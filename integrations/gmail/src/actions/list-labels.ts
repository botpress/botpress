import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const listLabels = wrapAction(
  { actionName: 'listLabels', errorMessageWhenFailed: 'Failed to list labels' },
  async ({ googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> }) => {
    const result = await googleClient.labels.list()

    return {
      labels: result.labels?.map((label) => ({
        id: label.id ?? undefined,
        name: label.name ?? undefined,
        type: label.type ?? undefined,
      })),
    }
  }
)
