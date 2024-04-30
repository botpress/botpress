import { mkRespond } from 'src/api-utils'
import { setFlow } from 'src/flow-state'
import { EventHandler } from '../types'
import { OnConversationAssigned } from '.botpress/installations/sf-live-agent/events/onConversationAssigned'
import { OnConversationEnded } from '.botpress/installations/sf-live-agent/events/onConversationEnded'
import { OnConversationRequestFailed } from '.botpress/installations/sf-live-agent/events/onConversationRequestFailed'
import { OnQueueUpdated } from '.botpress/installations/sf-live-agent/events/onQueueUpdated'

export const eventHandler: EventHandler = async (props) => {
  const respond = mkRespond(props)
  const payload = props.event.payload
  const { conversation } = await props.client.getConversation({
    id: (payload as OnConversationAssigned).conversation.id,
  })

  const upstreamId = conversation.tags['upstream'] as string
  const downstreamId = conversation.id as string

  switch (props.event.type) {
    case 'sfliveagent:onConversationAssigned':
      const { agentName } = payload as OnConversationAssigned
      respond({ conversationId: upstreamId, text: `Conversation Assigned to Agent '${agentName}'` })
      break
    case 'sfliveagent:onAgentTyping':
      break
    case 'sfliveagent:onAgentNotTyping':
      break
    case 'sfliveagent:onConversationEnded':
      respond({
        conversationId: upstreamId,
        text: 'Conversation Ended, Reason: ' + (payload as OnConversationEnded).reason,
      })

      // Will stop hitl because that conversation ended

      await setFlow({ client: props.client, conversationId: downstreamId }, { hitlEnabled: false })
      await setFlow({ client: props.client, conversationId: upstreamId }, { hitlEnabled: false })
      break
    case 'sfliveagent:onConversationRequestFailed':
      respond({
        conversationId: upstreamId,
        text: `Conversation Requested Failed, reason: ${(payload as OnConversationRequestFailed).reason}`,
      })

      // Will stop hitl because that the requeste failed

      await setFlow({ client: props.client, conversationId: downstreamId }, { hitlEnabled: false })
      await setFlow({ client: props.client, conversationId: upstreamId }, { hitlEnabled: false })
      break
    case 'sfliveagent:onConversationRequestSuccess':
      // Resquest Success on downstream

      break
    case 'sfliveagent:onQueueUpdated':
      const { estimatedWaitTime, position } = payload as OnQueueUpdated
      respond({
        conversationId: upstreamId,
        text: `Queue Updated (position: ${position}, estimatedWaitTime: ${estimatedWaitTime})`,
      })
      break
    default:
  }
}
