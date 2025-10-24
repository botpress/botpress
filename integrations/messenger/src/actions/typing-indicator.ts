import { MessengerTypes } from 'messaging-api-messenger'
import { createAuthenticatedMessengerClient } from '../misc/messenger-client'
import { getEndUserMessengerId } from '../misc/utils'
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

  const messengerClient = await createAuthenticatedMessengerClient(client, ctx)
  const userMessengerId = getEndUserMessengerId(conversation)
  for (const action of actions) {
    await messengerClient.sendSenderAction(userMessengerId, action)
  }
  return {}
}
