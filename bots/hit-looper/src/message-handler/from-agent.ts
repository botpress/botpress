import { mkRespond } from '../api-utils'
import { MessageHandlers } from '.botpress'
import * as bp from '.botpress'

export const agentMessageHandler =
  (_bot: bp.Bot): MessageHandlers['*'] =>
  async (props) => {
    const { conversation: downstreamConversation } = props
    const respond = mkRespond(props)

    await respond({
      conversationId: downstreamConversation.id,
      text: 'HITL is currently disabled.',
    })
  }
