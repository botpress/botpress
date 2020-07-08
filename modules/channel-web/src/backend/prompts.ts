import axios from 'axios'
import * as sdk from 'botpress/sdk'
import lang from 'common/lang'

export const handlePrompt = async (event: sdk.IO.OutgoingEvent, bp: typeof sdk): Promise<sdk.Content.All> => {
  const payload = event.payload as sdk.PromptNodeParams & sdk.Content.Base

  const defaultPayload: sdk.Content.Text = {
    type: 'text',
    text: payload.question,
    metadata: payload.metadata
  }

  const { __usePicker } = payload.metadata ?? ({} as sdk.Content.Metadata)

  switch (payload.type) {
    default:
      return defaultPayload

    case 'confirm':
      return {
        ...defaultPayload,
        metadata: {
          __buttons: [
            { label: lang.tr('module.builtin.yes'), value: 'yes' },
            { label: lang.tr('module.builtin.no'), value: 'no' }
          ],
          ...defaultPayload.metadata
        }
      }

    case 'enum':
      if (__usePicker) {
        let items = payload.items
        if (payload.entity) {
          const { data } = await axios.get(
            `mod/nlu/entities/${payload.entity}`,
            await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
          )
          items = data.occurrences
        }

        const field = items.length <= 2 ? '__buttons' : '__dropdown'

        return {
          ...defaultPayload,
          metadata: { ...defaultPayload.metadata, [field]: items }
        }
      }

      return defaultPayload
  }
}
