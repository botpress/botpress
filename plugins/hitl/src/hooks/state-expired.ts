import * as sdk from '@botpress/sdk'
import { DEFAULT_HITL_SESSION_TIMEOUT } from 'plugin.definition'
import { getTimeoutMs, isTimedOut } from 'src/hitl-timeout'
import * as hooks from './'
import * as bp from '.botpress'

export const hitlStateExpired: NonNullable<bp.PluginHandlers['stateExpiredHandlers']['hitl']>[number] = async (
  props: Parameters<NonNullable<bp.PluginHandlers['stateExpiredHandlers']['hitl']>[number]>[0]
) => {
  props.logger.info('HITL state expired for conversation', props.state.conversationId)
  if (!props.state.conversationId) {
    throw new sdk.RuntimeError('The hitl state expired without an attached conversation')
  }
  const conversation = await props.client.listMessages({ conversationId: props.state.conversationId })
  const timeout = props.configuration.hitlSessionTimeoutMinutes ?? DEFAULT_HITL_SESSION_TIMEOUT
  if (conversation.messages[0]?.createdAt && isTimedOut(conversation.messages[0]?.createdAt, timeout)) {
    await hooks.beforeIncomingEvent.hitlStopped.handleEvent({
      ...props,
      data: { payload: { conversationId: props.state.conversationId } },
    })
  } else {
    const newTimeout = getTimeoutMs(timeout)
    await props.states.conversation.hitl.set(props.state.conversationId, { hitlActive: true }, { expiryMs: newTimeout })
  }
  return undefined
}
