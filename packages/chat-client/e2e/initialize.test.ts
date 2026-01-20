import { expect, test } from 'vitest'
import _ from 'lodash'
import * as utils from './utils'
import * as config from './config'
import * as chat from '../src'

const apiUrl = config.get('API_URL')
const encryptionKey = config.get('ENCRYPTION_KEY')

type CheckApiCanSendAndReceiveMessagesProps = {
  client: chat.AuthenticatedClient
  conversationId: string
}

type MessagePayload = chat.AuthenticatedClientRequests['createMessage']['payload']

const checkApiCanSendAndReceiveMessages = async (
  props: CheckApiCanSendAndReceiveMessagesProps,
  payload: MessagePayload
): Promise<MessagePayload> => {
  const { client, conversationId } = props

  const listener = await client.listenConversation({
    id: conversationId,
  })

  const waitForResponsePromise = new Promise<chat.Signals['message_created']>((resolve) => {
    listener.onceOrMore('message_created', (ev) => {
      if (ev.userId === client.user.id) {
        return 'keep-listening'
      }
      resolve(ev)
      return 'stop-listening'
    })
  })

  const createMessageRequest: chat.AuthenticatedClientRequests['createMessage'] = {
    conversationId: conversationId,
    payload,
  }

  const createMessagePromise = client.createMessage(createMessageRequest).then((res) => res.message)

  const [{ isBot, ...messageReceived }, messageSent] = await Promise.all([waitForResponsePromise, createMessagePromise])

  const { messages } = await client
    .listMessages({
      conversationId,
    })
    .then(({ messages }) => ({
      messages: _.sortBy(messages, (m) => new Date(m.createdAt).getTime()),
    }))

  expect(messages.length).toBe(2)
  expect(messages[0]).toEqual(messageSent)
  expect(messages[1]).toEqual(messageReceived)

  return messageReceived.payload
}

test('api allows initializing a conversation, user and message', async () => {
  const client = new chat.Client({ apiUrl })

  const initializeResponse = await client.initializeIncomingMessage({
    message: { payload: { type: 'text', text: 'text' }, metadata: {} },
  })

  expect(initializeResponse).toMatchObject({
    conversation: expect.any(Object),
    user: expect.any(Object),
    message: expect.any(Object),
  })
})

test('api allows reusing a conversation and user', async () => {
  const client = new chat.Client({ apiUrl })
  const user = await client.createUser({})
  const conversation = await client.createConversation({ 'x-user-key': user.key })

  const initializeResponse = await client.initializeIncomingMessage({
    'x-user-key': user.key,
    conversationId: conversation.conversation.id,
  })

  expect(initializeResponse.user.id).toBe(user.user.id)
  expect(initializeResponse.conversation.id).toBe(conversation.conversation.id)
  expect(initializeResponse.message).toBeUndefined()
})
