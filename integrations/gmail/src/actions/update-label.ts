import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const updateLabel = wrapAction(
  { actionName: 'updateLabel', errorMessageWhenFailed: 'Failed to update label' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    {
      id,
      name,
      backgroundColor,
      textColor,
    }: { id: string; name?: string; backgroundColor?: string; textColor?: string }
  ) => {
    const result = await googleClient.labels.update(id, name, backgroundColor, textColor)

    return {
      id: result.id ?? undefined,
      name: result.name ?? undefined,
      type: result.type ?? undefined,
      color: result.color
        ? {
            backgroundColor: result.color.backgroundColor ?? undefined,
            textColor: result.color.textColor ?? undefined,
          }
        : undefined,
    }
  }
)
