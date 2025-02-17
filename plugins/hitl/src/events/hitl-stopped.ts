import { DEFAULT_HITL_STOPPED_MESSAGE } from '../../plugin.definition'
import * as conv from '../conv-manager'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['hitl:hitlStopped'] = async (props) => {
  const { conversationId: downstreamConversationId } = props.event.payload
  const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)
  const isHitlActive = await downstreamCm.isHitlActive()
  if (!isHitlActive) {
    return
  }

  const downstreamConversation = await props.client.getConversation({ id: downstreamConversationId })
  const upstreamConversationId = downstreamConversation.conversation.tags['upstream']
  if (!upstreamConversationId) {
    console.error('downstream conversation was not binded to upstream conversation')
    return
  }

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)
  const humanAgentName = downstreamConversation.conversation.tags['humanAgentName'] ?? 'The Human Agent'

  await Promise.allSettled([
    upstreamCm.respond({
      text: (props.configuration.onHitlStoppedMessage ?? DEFAULT_HITL_STOPPED_MESSAGE).replaceAll(
        '$humanAgentName',
        humanAgentName
      ),
    }),
    downstreamCm.setHitlInactive(),
    upstreamCm.setHitlInactive(),
  ])
}
