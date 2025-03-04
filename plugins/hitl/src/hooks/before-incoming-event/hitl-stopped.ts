import { DEFAULT_HITL_STOPPED_MESSAGE } from '../../../plugin.definition'
import * as conv from '../../conv-manager'
import * as bp from '.botpress'

const STOP_EVENT_HANDLING = { stop: true } as const // we don't want the bot to answer to the human agent in the ticket

export const handleEvent: bp.HookHandlers['before_incoming_event']['hitl:hitlStopped'] = async (props) => {
  const { conversationId: downstreamConversationId } = props.data.payload
  const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)
  const isHitlActive = await downstreamCm.isHitlActive()
  if (!isHitlActive) {
    return STOP_EVENT_HANDLING
  }

  const downstreamConversation = await props.client.getConversation({ id: downstreamConversationId })
  const upstreamConversationId = downstreamConversation.conversation.tags['upstream']
  if (!upstreamConversationId) {
    props.logger
      .withConversationId(downstreamConversationId)
      .error('Downstream conversation was not binded to upstream conversation')
    return STOP_EVENT_HANDLING
  }

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)

  await Promise.allSettled([
    upstreamCm.respond({
      text: props.configuration.onHitlStoppedMessage ?? DEFAULT_HITL_STOPPED_MESSAGE,
    }),
    downstreamCm.setHitlInactive(),
    upstreamCm.setHitlInactive(),
  ])
  return STOP_EVENT_HANDLING
}
