import * as conv from '../conv-manager'
import * as user from '../user-linker'
import * as bp from '.botpress'
import { DEFAULT_HITL_HANDOFF_MESSAGE } from '../../plugin.definition'

type StartHitlInput = bp.interfaces.hitl.actions.startHitl.input.Input
type MessageHistoryElement = NonNullable<StartHitlInput['messageHistory']>[number]
type Props = Parameters<bp.PluginProps['actions']['startHitl']>[0]

export const startHitl: bp.PluginProps['actions']['startHitl'] = async (props) => {
  const { conversationId: upstreamConversationId, userId: upstreamUserId, userEmail: upstreamUserEmail } = props.input
  const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)

  if (await upstreamCm.isHitlActive()) {
    return {}
  }

  await _sendHandoffMessage(props, upstreamCm)

  const users = new user.UserLinker(props)
  const downstreamUserId = await users.getDownstreamUserId(upstreamUserId, { email: upstreamUserEmail })

  const messageHistory = await _buildMessageHistory(props, upstreamConversationId, users)

  const downstreamConversationId = await _createDownstreamConversation(
    props,
    downstreamUserId,
    props.input,
    messageHistory
  )
  const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)

  await _linkConversations(props, upstreamConversationId, downstreamConversationId)
  await _activateHitl(upstreamCm, downstreamCm)

  return {}
}

const _sendHandoffMessage = (props: Props, upstreamCm: conv.ConversationManager): Promise<void> =>
  upstreamCm.respond({
    text: props.configuration.onHitlHandoffMessage ?? DEFAULT_HITL_HANDOFF_MESSAGE,
  })

const _buildMessageHistory = async (
  props: Props,
  upstreamConversationId: string,
  users: user.UserLinker
): Promise<MessageHistoryElement[]> => {
  const { messages: upstreamMessages } = await props.client.listMessages({ conversationId: upstreamConversationId })

  // Sort messages by creation date, with the oldest first:
  upstreamMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const messageHistory: MessageHistoryElement[] = await Promise.all(
    upstreamMessages.map(
      async (message) =>
        ({
          source:
            message.direction === 'outgoing'
              ? { type: 'bot' }
              : {
                  type: 'user',
                  userId: await users.getDownstreamUserId(message.userId),
                },
          type: message.type,
          payload: message.payload,
        }) as MessageHistoryElement
    )
  )

  return messageHistory
}

const _createDownstreamConversation = async (
  props: Props,
  downstreamUserId: string,
  input: StartHitlInput,
  messageHistory: MessageHistoryElement[]
): Promise<string> => {
  // Call startHitl in the hitl integration (zendesk, etc.):
  const { conversationId: downstreamConversationId } = await props.actions.hitl.startHitl({
    title: input.title,
    description: input.description,
    userId: downstreamUserId,
    messageHistory,
  })

  return downstreamConversationId
}

const _linkConversations = (props: Props, upstreamConversationId: string, downstreamConversationId: string) =>
  Promise.all([
    props.client.updateConversation({
      id: upstreamConversationId,
      tags: {
        downstream: downstreamConversationId,
      },
    }),
    props.client.updateConversation({
      id: downstreamConversationId,
      tags: {
        upstream: upstreamConversationId,
      },
    }),
  ])

const _activateHitl = (upstreamCm: conv.ConversationManager, downstreamCm: conv.ConversationManager) =>
  Promise.all([upstreamCm.setHitlActive(), downstreamCm.setHitlActive()])
