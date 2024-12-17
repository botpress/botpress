import { MessengerTypes } from 'messaging-api-messenger'
import { getRecipientId } from 'src/misc/outgoing-message'
import { getMessengerClient } from 'src/misc/utils'
import * as bp from '.botpress'

export const startTypingIndicator: bp.IntegrationProps['actions']['startTypingIndicator'] = async (props) => {
  await sendTypingIndicator({ props, action: 'typing_on' })
  return {}
}

export const stopTypingIndicator: bp.IntegrationProps['actions']['stopTypingIndicator'] = async (props) => {
  await sendTypingIndicator({ props, action: 'typing_off' })
  return {}
}

const sendTypingIndicator = async ({
  props: { client, ctx, input },
  action,
}: {
  props: bp.AnyActionProps
  action: MessengerTypes.SenderAction
}) => {
  const { conversationId } = input
  const messengerClient = await getMessengerClient(client, ctx)
  const { conversation } = await client.getConversation({ id: conversationId })
  const recipientId = getRecipientId(conversation)
  await messengerClient.sendSenderAction(recipientId, action)
  return {}
}

export default {
  startTypingIndicator,
  stopTypingIndicator,
}
