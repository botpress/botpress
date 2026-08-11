import { DEFAULT_AGENT_DISCONNECTED_MESSAGE, DEFAULT_SESSION_MIGRATED_MESSAGE } from '../plugin.definition'
import { buildMessageHistory } from './actions/start-hitl'
import {
  callBackingIntegrationAction,
  resolveBackingIntegrationForDownstreamConversation,
  type HitlBackingIntegration,
} from './backing-integration'
import * as conv from './conv-manager'
import type * as types from './types'
import { UserLinker } from './user-linker'
import type * as bp from '.botpress'

/**
 * Moves an active handoff session to the integration currently backing the
 * plugin's hitl dependency: a new downstream conversation opens there with
 * the message history, the upstream conversation re-links to it, and only
 * then does the old downstream conversation get a notice and close. When
 * any step fails before the upstream conversation is re-linked, the
 * just-created downstream conversation is closed on a best-effort basis and
 * the session stays untouched on its old integration, so a retry never
 * leaves more than one downstream conversation unclosed.
 */
export const tryMigrateSession = async (migration: {
  props: bp.HookHandlerProps['before_incoming_message']
  upstreamConversation: types.ActionableConversation
  downstreamConversation: types.ActionableConversation
  backingIntegration: HitlBackingIntegration
  sessionConfig: Partial<bp.configuration.Configuration>
}): Promise<{ migrated: boolean }> => {
  const { props, upstreamConversation, downstreamConversation, backingIntegration, sessionConfig } = migration
  const upstreamCm = conv.ConversationManager.from(props, upstreamConversation)

  let newDownstreamConversationId: string | undefined
  try {
    const users = new UserLinker(props, backingIntegration)
    const downstreamUserId = await users.getDownstreamUserId(props.data.userId)
    const messageHistory = await buildMessageHistory(upstreamConversation, users)
    const output = await callBackingIntegrationAction({
      client: props.client,
      backingIntegration,
      name: 'startHitl',
      input: { userId: downstreamUserId, messageHistory },
    })
    newDownstreamConversationId = output.conversationId

    const newDownstreamConversation = await props.conversations.hitl.hitl.getById({
      id: newDownstreamConversationId,
    })
    const newDownstreamCm = conv.ConversationManager.from(props, newDownstreamConversation)

    await Promise.all([
      newDownstreamConversation.update({ tags: { upstream: upstreamConversation.id } }),
      newDownstreamCm.setHitlActive(),
    ])
    // Re-linking the upstream conversation is the last step that can fail:
    // once it points at the new downstream conversation, no failure path may
    // close that conversation, and any earlier failure leaves the session
    // fully on the old one.
    await upstreamConversation.update({ tags: { downstream: newDownstreamConversation.id } })
  } catch (thrown: unknown) {
    props.logger
      .withConversationId(upstreamConversation.id)
      .error(
        `Failed to migrate the session to "${backingIntegration.alias}": ${thrown instanceof Error ? thrown.message : String(thrown)}`
      )
    if (newDownstreamConversationId) {
      await callBackingIntegrationAction({
        client: props.client,
        backingIntegration,
        name: 'stopHitl',
        input: { conversationId: newDownstreamConversationId },
      }).catch(() => {})
    }
    return { migrated: false }
  }

  // An agent closing the old downstream conversation while this migration
  // runs marks the upstream conversation inactive through the stop handler;
  // the session lives on in the new one, so mark it active again. Best
  // effort: a failure here must not close the conversation the session now
  // points at.
  await upstreamCm
    .setHitlActive()
    .catch((thrown: unknown) =>
      props.logger
        .withConversationId(upstreamConversation.id)
        .error(`Failed to re-assert the session: ${thrown instanceof Error ? thrown.message : String(thrown)}`)
    )

  await _scheduleAgentAssignmentTimeout({ props, upstreamCm, newDownstreamConversationId, sessionConfig })

  const oldDownstreamCm = conv.ConversationManager.from(props, downstreamConversation)
  await oldDownstreamCm.maybeRespondText(sessionConfig.onSessionMigratedMessage, DEFAULT_SESSION_MIGRATED_MESSAGE)
  await oldDownstreamCm.setHitlInactive(conv.HITL_END_REASON.SESSION_MIGRATED)
  await callBackingIntegrationAction({
    client: props.client,
    backingIntegration: resolveBackingIntegrationForDownstreamConversation({
      props,
      downstreamIntegrationAlias: downstreamConversation.integration,
    }),
    name: 'stopHitl',
    input: { conversationId: downstreamConversation.id },
  }).catch((thrown: unknown) =>
    props.logger
      .withConversationId(downstreamConversation.id)
      .error(
        `Failed to close the previous downstream conversation: ${thrown instanceof Error ? thrown.message : String(thrown)}`
      )
  )

  await upstreamCm.maybeRespondText(sessionConfig.onAgentDisconnectedMessage, DEFAULT_AGENT_DISCONNECTED_MESSAGE)
  return { migrated: true }
}

const _scheduleAgentAssignmentTimeout = async ({
  props,
  upstreamCm,
  newDownstreamConversationId,
  sessionConfig,
}: {
  props: bp.HookHandlerProps['before_incoming_message']
  upstreamCm: conv.ConversationManager
  newDownstreamConversationId: string
  sessionConfig: Partial<bp.configuration.Configuration>
}) => {
  const { agentAssignedTimeoutSeconds } = sessionConfig
  if (!agentAssignedTimeoutSeconds) {
    return
  }

  await props.events.humanAgentAssignedTimeout
    .withConversationId(upstreamCm.conversationId)
    .withUserId(props.data.userId)
    .schedule(
      {
        sessionStartedAt: new Date().toISOString(),
        downstreamConversationId: newDownstreamConversationId,
      },
      { delay: agentAssignedTimeoutSeconds * 1000 }
    )
}
