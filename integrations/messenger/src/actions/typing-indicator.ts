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
  const messengerClient = await createMessengerClient(client, ctx)
  const { conversation } = await client.getConversation({ id: conversationId })
  const recipientId = getRecipientId(conversation)
  for (const action of actions) {
    await messengerClient.sendSenderAction(recipientId, action)
  }
  return {}
}
