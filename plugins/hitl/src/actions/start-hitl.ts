import * as sdk from '@botpress/sdk'
import { DEFAULT_HITL_HANDOFF_MESSAGE } from '../../plugin.definition'
import * as configuration from '../configuration'
import * as conv from '../conv-manager'
import * as user from '../user-linker'
import * as bp from '.botpress'

type StartHitlInput = bp.interfaces.hitl.actions.startHitl.input.Input
type MessageHistoryElement = NonNullable<StartHitlInput['messageHistory']>[number]
type Props = Parameters<bp.PluginProps['actions']['startHitl']>[0]

export const startHitl: bp.PluginProps['actions']['startHitl'] = async (props) => {
  const { conversationId: upstreamConversationId, userId: upstreamUserId, userEmail: upstreamUserEmail } = props.input
  if (!upstreamConversationId.length) {
    throw new sdk.RuntimeError('conversationId is required to start HITL')
  }
  if (!upstreamUserId.length) {
    throw new sdk.RuntimeError('userId is required to start HITL')
  }

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)

  const { conversation: upstreamConversation } = await props.client.getConversation({ id: upstreamConversationId })

  if (upstreamConversation.tags.upstream || upstreamConversation.integration === props.interfaces.hitl.name) {
    // Without this check, closing the downstream conversation (the ticket) can
    // result in the bot calling startHitl a second time, but using the
    // downstream conversation as if it was the upstream conversation. Human
    // support agents would thus see "I have escalated this to a human" inside
    // the ticket after closing it.
    return {}
  }

  if (await upstreamCm.isHitlActive()) {
    return {}
  }

  const lastMessageByUser = await _getLastUserMessageId(props)

  if (upstreamConversation.tags.startMessageId && upstreamConversation.tags.startMessageId === lastMessageByUser) {
    // This is a hack because of a bug in the studio or webchat that causes it
    // to call startHitl by replaying the same message.
    return {}
  }

  const sessionConfig = await configuration.configureNewHitlSession({
    ...props,
    upstreamConversationId,
    configurationOverrides: props.input.configurationOverrides,
  })
  await _sendHandoffMessage(upstreamCm, sessionConfig)

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
  await _saveStartMessageId(props, lastMessageByUser)
  await _activateHitl(upstreamCm, downstreamCm)
  await _startHitlTimeout(props, upstreamCm, downstreamCm, upstreamUserId, sessionConfig)

  return {}
}

const _sendHandoffMessage = (
  upstreamCm: conv.ConversationManager,
  sessionConfig: bp.configuration.Configuration
): Promise<void> =>
  upstreamCm.respond({ type: 'text', text: sessionConfig.onHitlHandoffMessage ?? DEFAULT_HITL_HANDOFF_MESSAGE })

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
  input: Omit<StartHitlInput, 'messageHistory'>,
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

const _startHitlTimeout = async (
  props: Props,
  upstreamCm: conv.ConversationManager,
  downstreamCm: conv.ConversationManager,
  upstreamUserId: string,
  sessionConfig: bp.configuration.Configuration
) => {
  const { agentAssignedTimeoutSeconds } = sessionConfig

  if (!agentAssignedTimeoutSeconds) {
    return
  }

  await props.client.createEvent({
    type: 'humanAgentAssignedTimeout',
    payload: {
      sessionStartedAt: new Date().toISOString(),
      downstreamConversationId: downstreamCm.conversationId,
    },
    conversationId: upstreamCm.conversationId,
    userId: upstreamUserId,
    schedule: { delay: agentAssignedTimeoutSeconds * 1000 },
  })
}

/**
 * Gets the id of the last message sent by the user in the conversation.
 *
 * This is effectively a hack to ensure that the studio/webchat does not call
 * startHitl twice for the same user message.
 */
const _getLastUserMessageId = async (props: Props): Promise<string | undefined> => {
  let nextToken: string | undefined

  do {
    const { messages, meta } = await props.client.listMessages({ conversationId: props.input.conversationId })

    for (const message of messages) {
      if (message.direction === 'incoming') {
        return message.id
      }
    }

    nextToken = meta.nextToken
  } while (nextToken)

  return
}

const _saveStartMessageId = async (props: Props, startMessageId: string | undefined) => {
  if (!startMessageId) {
    return
  }

  await props.client.updateConversation({
    id: props.input.conversationId,
    tags: {
      startMessageId,
    },
  })
}
