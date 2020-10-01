import axios from 'axios'
import * as sdk from 'botpress/sdk'
import lang from 'common/lang'

export async function setupMiddleware(bp: typeof sdk, prompts: { id; config: sdk.PromptConfig }[]) {
  bp.events.registerMiddleware({
    description: 'Handle prompts for module builtin',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: 'builtin.prompt',
    order: 2
  })

  async function outgoingHandler(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    if (event.type !== 'prompt' || !prompts.find(x => x.id === event.payload.type)) {
      return next(undefined, false, true)
    }

    next(undefined, true)

    const payload = await handlePrompt(event, bp)
    await bp.events.replyContentToEvent(payload, event, { incomingEventId: event.incomingEventId })
  }
}

export const handlePrompt = async (event: sdk.IO.OutgoingEvent, bp: typeof sdk): Promise<sdk.Content.All> => {
  const payload = event.payload as sdk.PromptNodeParams & sdk.Content.Base

  const defaultPayload: sdk.Content.Text = {
    type: 'text',
    text: ((payload.question as string) ?? ' ').replace('__VARNAME', payload.output),
    metadata: payload.metadata
  }

  const { __useDropdown } = payload.metadata ?? ({} as sdk.Content.Metadata)

  switch (payload.type) {
    default:
      return defaultPayload

    case 'confirm':
      return {
        ...defaultPayload,
        metadata: {
          ...defaultPayload.metadata,
          __suggestions: [
            { label: lang.tr('module.builtin.yes'), value: 'yes' },
            { label: lang.tr('module.builtin.no'), value: 'no' }
          ]
        }
      }

    case 'enumeration':
      let items = payload.items

      if (payload.subType) {
        const { data } = await axios.get(
          `nlu/entities/${payload.subType}`,
          await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
        )
        items = data.occurrences.map(x => ({ label: x.name, value: x.name }))
      }

      if (!items?.length) {
        return defaultPayload
      }

      return {
        ...defaultPayload,
        metadata: {
          ...defaultPayload.metadata,
          __suggestions: [...(defaultPayload.metadata?.__suggestions || []), ...items]
        }
      }
  }
}
