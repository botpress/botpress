import { getFreshchatClient } from 'src/client'
import { ActionCreateConversation } from '../schemas'

export const sendMessage: ActionCreateConversation = async ({ ctx, client, input, logger }) => {
  const freshchatClient = getFreshchatClient({ ...ctx.configuration })

  let payload;

  try {
    payload = JSON.parse(input.payload)
  } catch (e) {
    payload = { text: 'invalid payload from user message: ' + e.message }
  }

  if(!payload.text?.length) {
    payload = { text: 'Invalid user payload: only text is supported'}
  }

  console.log('Will send message with args', {
    payload,
    input
  })

  await freshchatClient.sendMessage(input.freshchatUserId, input.freshchatConversationId, payload.text)

  return {}
}
