import * as conv from '../conv-manager'
import * as user from '../user-linker'
import * as bp from '.botpress'
import { DEFAULT_HITL_HANDOFF_MESSAGE } from '../../plugin.definition'

type StartHitlInput = bp.interfaces.hitl.actions.startHitl.input.Input
type MessageHistoryElement = NonNullable<StartHitlInput['messageHistory']>[number]

export const startHitl: bp.PluginProps['actions']['startHitl'] = async (props) => {
  const { conversationId: upstreamConversationId, userId: upstreamUserId } = props.input

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)
  if (await upstreamCm.isHitlActive()) {
    return {}
  }

  await upstreamCm.respond({
    text: props.configuration.onHitlHandoffMessage ?? DEFAULT_HITL_HANDOFF_MESSAGE,
  })

  const users = new user.UserLinker(props)
  const downstreamUserId = await users.getDownstreamUserId(upstreamUserId)

  const { messages: upstreamMessages } = await props.client.listMessages({ conversationId: upstreamConversationId })
  upstreamMessages.reverse() // TODO: use createdAt to sort instead of reverse

  const messageHistory: MessageHistoryElement[] = []
  for (const message of upstreamMessages) {
    const source =
      message.direction === 'outgoing'
        ? { type: 'bot' }
        : {
            type: 'user',
            userId: await users.getDownstreamUserId(message.userId),
          }
    messageHistory.push({
      source,
      type: message.type,
      payload: message.payload,
    } as MessageHistoryElement)
  }

  const { conversationId: downstreamConversationId } = await props.actions.hitl.startHitl({
    title: props.input.title,
    description: props.input.description,
    userId: downstreamUserId,
    messageHistory: [], // TODO: pass actual message history
  })

  const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)

  await props.client.updateConversation({
    id: upstreamConversationId,
    tags: {
      downstream: downstreamConversationId,
    },
  })

  await props.client.updateConversation({
    id: downstreamConversationId,
    tags: {
      upstream: upstreamConversationId,
    },
  })

  await upstreamCm.setHitlActive(true)
  await downstreamCm.setHitlActive(true)

  return {}
}
