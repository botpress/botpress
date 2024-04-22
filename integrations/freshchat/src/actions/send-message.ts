import { getFreshchatClient } from 'src/client'
import { ActionCreateConversation } from '../schemas'
import { executeConversationAssigned } from '../events/conversation-assigned'
import * as console from 'node:console'

export const sendMessage: ActionCreateConversation = async ({ ctx, client, input, logger }) => {
  const freshchatClient = getFreshchatClient({ ...ctx.configuration })

  const botpressProxyUser = await client.getUser({
    id: input.proxyUserId
  })

  if(!botpressProxyUser) {
    logger.forBot().error(`Botpress proxy User ${input.proxyUserId} doesn't exist`)
    return {};
  }

  console.log('Proxy will receive the following message', { input })

  let payload;

  try {
    payload = JSON.parse(input.payload)
  } catch (e) {
    payload = { text: 'invalid payload: ' + e.message }
  }

  const createMessage = {
    userId: botpressProxyUser.user.id,
    type: 'text',
    payload,
    conversationId: input.proxyConversationId,
    tags: {}
  }

  console.log('Will create message with args', createMessage)

  await client.createMessage(createMessage)

  return {}
}
