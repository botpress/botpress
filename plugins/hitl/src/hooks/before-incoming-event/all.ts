import pluginDefinition from '../../../plugin.definition'
import * as conv from '../../conv-manager'
import * as consts from '../consts'
import * as bp from '.botpress'

const PLUGIN_EVENTS = Object.keys(pluginDefinition.events ?? {})

export const handleEvent: bp.HookHandlers['before_incoming_event']['*'] = async (props) => {
  const conversationId = _retrieveConversationId(props)
  if (!conversationId) {
    return
  }

  if (PLUGIN_EVENTS.includes(props.data.type)) {
    props.logger.debug('Skipping handling of own event', {
      eventType: props.data.type,
      hitlPluginEvents: PLUGIN_EVENTS,
    })
    return
  }

  const downstreamCm = conv.ConversationManager.from(props, conversationId)
  const isHitlActive = await downstreamCm.isHitlActive()
  if (isHitlActive) {
    /**
     * if conversation is downstream; we prevent the bot from answering in the ticket
     * if conversation is upstream; we prevent the bot from answering in the chat
     */
    return consts.STOP_EVENT_HANDLING
  }

  return
}

const _retrieveConversationId = (props: bp.HookHandlerProps['before_incoming_event']): string | undefined => {
  const { data: event } = props
  if (event.conversationId) {
    return event.conversationId
  }
  if ('conversationId' in event.payload && typeof event.payload.conversationId === 'string') {
    return event.payload.conversationId
  }
  return undefined
}
