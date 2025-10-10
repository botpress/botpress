import { MessengerTypes } from 'messaging-api-messenger'
import { create as createMessengerClient } from '../misc/messenger-client'
import { getRecipientId } from '../misc/utils'
import * as bp from '.botpress'

export const startTypingIndicator: bp.IntegrationProps['actions']['startTypingIndicator'] = async (props) => {
  await sendSenderActions({ props, actions: ['typing_on', 'mark_seen'] })
  return {}
}

export const stopTypingIndicator: bp.IntegrationProps['actions']['stopTypingIndicator'] = async (props) => {
  await sendSenderActions({ props, actions: ['typing_off'] })
  return {}
}

const sendSenderActions = async ({
  props: { client, ctx, input },
  actions,
}: {
  props: bp.ActionProps['startTypingIndicator'] | bp.ActionProps['stopTypingIndicator']
  actions: MessengerTypes.SenderAction[]
}) => {
  const { conversationId } = input
  const { conversation } = await client.getConversation({ id: conversationId })

  // Skip typing indicators for feed channel as it uses Facebook Page IDs, not Messenger user IDs
  if (conversation.channel !== 'channel') {
    return {}
  }

  const messengerClient = await createMessengerClient(client, ctx)
  const recipientId = getRecipientId(conversation)
  for (const action of actions) {
    await messengerClient.sendSenderAction(recipientId, action)
  }
  return {}
}
