import * as sdk from '@botpress/sdk'
import { DEFAULT_HITL_HANDOFF_MESSAGE } from '../../plugin.definition'
import * as configuration from '../configuration'
import * as conv from '../conv-manager'
import type * as types from '../types'
import * as user from '../user-linker'
import * as bp from '.botpress'

type StartHitlInput = bp.actions.startHitl.input.Input
type MessageHistoryElement = NonNullable<bp.interfaces.hitl.actions.startHitl.input.Input['messageHistory']>[number]
type Props = Parameters<bp.PluginProps['actions']['startHitl']>[0]

export const startHitl: bp.PluginProps['actions']['startHitl'] = async (props) => {
  const { conversationId: upstreamConversationId, userId: upstreamUserId, userEmail: upstreamUserEmail } = props.input
  if (!upstreamConversationId.length) {
    throw new sdk.RuntimeError('conversationId is required to start HITL')
  }
  if (!upstreamUserId.length) {
    throw new sdk.RuntimeError('userId is required to start HITL')
  }

  const upstreamConversation = await props.conversations.hitl.hitl.getById({ id: upstreamConversationId })
  const upstreamCm = conv.ConversationManager.from(props, upstreamConversation)

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

  const lastMessageByUser = await _getLastUserMessageId({ upstreamConversation })

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

  const messageHistory = await _buildMessageHistory(upstreamConversation, users)

  const downstreamConversation = await _createDownstreamConversation(
    props,
    downstreamUserId,
    props.input,
    messageHistory
  )
  const downstreamCm = conv.ConversationManager.from(props, downstreamConversation)

  await upstreamCm.setUserId(upstreamUserId)

  await _linkConversations(upstreamConversation, downstreamConversation)
  await _saveStartMessageId({ upstreamConversation, startMessageId: lastMessageByUser })
  await _activateHitl(upstreamCm, downstreamCm)
  await _startHitlTimeout(props, upstreamCm, downstreamCm, upstreamUserId, sessionConfig)

  return {}
}

const _sendHandoffMessage = (
  upstreamCm: conv.ConversationManager,
  sessionConfig: bp.configuration.Configuration
): Promise<void> => upstreamCm.maybeRespondText(sessionConfig.onHitlHandoffMessage, DEFAULT_HITL_HANDOFF_MESSAGE)

const _buildMessageHistory = async (
  upstreamConversation: types.ActionableConversation,
  users: user.UserLinker
): Promise<MessageHistoryElement[]> => {
  const upstreamMessages = await upstreamConversation.listMessages().takePage(1)

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
): Promise<types.ActionableConversation> => {
  // Call startHitl in the hitl integration (zendesk, etc.):
  const { conversationId: downstreamConversationId } = await props.actions.hitl.startHitl({
    title: input.title,
    description: input.description,
    hitlSession: input.hitlSession,
    userId: downstreamUserId,
    messageHistory,
  })

  return await props.conversations.hitl.hitl.getById({ id: downstreamConversationId })
}

const _linkConversations = (
  upstreamConversation: types.ActionableConversation,
  downstreamConversation: types.ActionableConversation
) =>
  Promise.all([
    upstreamConversation.update({
      tags: {
        downstream: downstreamConversation.id,
      },
    }),
    downstreamConversation.update({
      tags: {
        upstream: upstreamConversation.id,
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

  await props.events.humanAgentAssignedTimeout
    .withConversationId(upstreamCm.conversationId)
    .withUserId(upstreamUserId)
    .schedule(
      {
        sessionStartedAt: new Date().toISOString(),
        downstreamConversationId: downstreamCm.conversationId,
      },
      { delay: agentAssignedTimeoutSeconds * 1000 }
    )
}

/**
 * Gets the id of the last message sent by the user in the conversation.
 *
 * This is effectively a hack to ensure that the studio/webchat does not call
 * startHitl twice for the same user message.
 */
const _getLastUserMessageId = async (props: {
  upstreamConversation: types.ActionableConversation
}): Promise<string | undefined> => {
  for await (const message of props.upstreamConversation.listMessages()) {
    if (message.direction === 'incoming') {
      return message.id
    }
  }

  return
}

const _saveStartMessageId = async (props: {
  upstreamConversation: types.ActionableConversation
  startMessageId: string | undefined
}) => {
  if (!props.startMessageId) {
    return
  }

  await props.upstreamConversation.update({
    tags: {
      startMessageId: props.startMessageId,
    },
  })
}
