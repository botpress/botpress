import { DEFAULT_HUMAN_AGENT_ASSIGNED_MESSAGE } from '../../plugin.definition'
import * as configuration from '../configuration'
import * as conv from '../conv-manager'
import * as types from '../types'
import { tryLinkWebchatUser } from '../webchat'
import * as bp from '.botpress'

type AssignAgentProps = bp.HookHandlerProps['before_incoming_message'] | bp.HookHandlerProps['before_incoming_event']

export type AssignAgentOptions = {
  props: AssignAgentProps
  downstreamConversation: types.ActionableConversation
  humanAgentUserId: string
  forceLinkWebchatUser?: boolean
}

/**
 * Assigns a human agent to both downstream and upstream conversations.
 * Also links the webchat user if applicable and sends the agent assigned message.
 */
export const assignAgent = async (options: AssignAgentOptions): Promise<boolean> => {
  const { props, downstreamConversation, humanAgentUserId, forceLinkWebchatUser = true } = options

  const upstreamConversationId = downstreamConversation.tags.upstream
  if (!upstreamConversationId?.length) {
    props.logger
      .withConversationId(downstreamConversation.id)
      .error('Downstream conversation was not binded to upstream conversation')
    return false
  }

  const upstreamConversation = await props.conversations.hitl.hitl.getById({
    id: upstreamConversationId,
  })

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversation)
  const downstreamCm = conv.ConversationManager.from(props, downstreamConversation)
  const humanAgentUser = await props.users.getById({ id: humanAgentUserId })
  const humanAgentName = humanAgentUser?.name?.length ? humanAgentUser.name : 'A Human Agent'

  const sessionConfig = await configuration.retrieveSessionConfig({
    ...props,
    upstreamConversationId: upstreamConversation.id,
  })

  await Promise.all([
    downstreamCm.setHumanAgent(humanAgentUserId, humanAgentName),
    upstreamCm.setHumanAgent(humanAgentUserId, humanAgentName),
    upstreamCm.maybeRespondText(sessionConfig.onHumanAgentAssignedMessage, DEFAULT_HUMAN_AGENT_ASSIGNED_MESSAGE),
    tryLinkWebchatUser(props, {
      downstreamUser: humanAgentUser,
      upstreamConversation,
      forceLink: forceLinkWebchatUser,
    }),
  ])

  return true
}
