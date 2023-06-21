import { Client, Conversation } from '@botpress/client'
import { MessagingClient } from '@botpress/messaging-client'

import { INTEGRATION_STATE_NAME, INTEGRATION_STATE_TYPE, USER_DATA_STATE_NAME } from './const'
import { fireConversationStarted } from './events/conversation-started'
import { handleTrigger } from './events/trigger'
import { NewMessage, NewUser, incomingEventSchema } from './misc/messaging/incoming-event'
import { OutgoingMessage } from './misc/messaging/outgoing-message'
import { IntegrationCtx } from './misc/types'
import { getTag, getUserAndConversation } from './misc/utils'
import * as botpress from '.botpress'

export const handler: botpress.IntegrationProps['handler'] = async ({ req, client }) => {
  if (!req.body) {
    console.warn('Handler received an empty body')
    return
  }

  const jsonBody = JSON.parse(req.body)
  console.debug('Handler received event', JSON.stringify(jsonBody, null, 2))
  const body = incomingEventSchema.parse(jsonBody)

  console.info('Received event', body.type, body)

  switch (body.type) {
    case 'message.new':
      await handleNewMessage(body.data, client)
      break
    case 'user.new':
      await handleNewUser(body.data, client)
      break
    case 'user.updated':
      await handleUpdateUser(body.data, client)
      break
    case 'conversation.started':
      await fireConversationStarted(body.data, client)
      break
    default:
      console.warn('Unknown message type', body.type)
      return
  }
}

export const send = async (params: {
  message: OutgoingMessage
  ctx: IntegrationCtx
  conversation: Conversation
  client: Client
}) => {
  const { message, ctx, client, conversation } = params

  const messagingClient = await getMessagingClient(ctx, client)

  const conversationId = getTag(conversation.tags, 'id')

  if (!conversationId) {
    throw new Error('No conversation id')
  }

  await messagingClient.createMessage(conversationId, undefined, message)
}

async function handleNewUser(newUser: NewUser, client: Client) {
  const { user } = await client.getOrCreateUser({
    tags: { id: newUser.userId },
  })

  if (newUser.userData) {
    await client.setState({
      type: 'user',
      id: user.id,
      name: USER_DATA_STATE_NAME,
      payload: newUser.userData,
    })
  }
}

async function handleUpdateUser(newUser: NewUser, client: Client) {
  const { user } = await client.getOrCreateUser({
    tags: { id: newUser.userId },
  })

  await client.setState({
    type: 'user',
    id: user.id,
    name: USER_DATA_STATE_NAME,
    payload: newUser.userData ?? null,
  })
}

async function handleNewMessage(newMessage: NewMessage, client: Client) {
  if (!newMessage.message.authorId) {
    console.info('Ignoring message from bot')
    return
  }

  const { message } = newMessage
  const { conversationId, userId } = await getUserAndConversation(
    {
      webchatConvoId: newMessage.conversationId,
      webchatUserId: newMessage.userId,
    },
    client
  )

  const isTriggerHandled = await handleTrigger({ client, conversationId, userId, payload: newMessage.message.payload })

  if (!isTriggerHandled) {
    await client.createMessage({
      tags: { id: message.id },
      type: message.payload.type,
      userId,
      conversationId,
      payload: message.payload,
    })
  }
}

async function getMessagingClient(ctx: IntegrationCtx, client: Client) {
  const { configuration, integrationId } = ctx
  const { messagingUrl, clientId, clientToken } = configuration

  const {
    state: { payload: statePayload },
  } = await client.getState({ id: integrationId, type: INTEGRATION_STATE_TYPE, name: INTEGRATION_STATE_NAME })

  const webhookToken = statePayload.webhookToken ?? statePayload.webhook.token

  return new MessagingClient({
    url: messagingUrl,
    clientId,
    clientToken,
    webhookToken,
  })
}
