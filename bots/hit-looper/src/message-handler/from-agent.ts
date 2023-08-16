import { respond } from '../api-utils'
import { getOrCreateFlow } from '../flow-state'
import { MessageHandler } from '../types'

export const agentMessageHandler: MessageHandler = async ({ client, conversation: downstream, message, ctx }) => {
  const flow = await getOrCreateFlow({ client, conversationId: downstream.id }, { hitlEnabled: true })
  if (!flow.hitlEnabled) {
    return // hitl is not enabled so agent cannot send messages
  }

  // TODO: handle /stop_hitl command

  if (!downstream.tags['upstream']) {
    throw new Error('Downstream conversation was not binded to upstream conversation')
  }
  await respond({ client, conversationId: downstream.tags['upstream'], ctx }, message.payload.text)
}
