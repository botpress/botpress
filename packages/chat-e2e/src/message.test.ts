import { expect, test } from 'vitest'
import _ from 'lodash'
import * as utils from './utils'
import * as config from './config'
import * as chat from '@botpress/chat/src'

const apiUrl = config.get('API_URL')
const encryptionKey = config.get('ENCRYPTION_KEY')

type CheckApiCanSendAndReceiveMessagesProps = {
  client: chat.AuthenticatedClient
  conversationId: string
}
const checkApiCanSendAndReceiveMessages = async (props: CheckApiCanSendAndReceiveMessagesProps): Promise<void> => {
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
    payload: {
      type: 'text',
      text: 'hello world',
    },
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
}

test('api allows sending and receiving messages using botpress IDs', async () => {
  const client = await chat.Client.connect({ apiUrl })

  const {
    conversation: { id: conversationId },
  } = await client.createConversation({})

  await checkApiCanSendAndReceiveMessages({
    client,
    conversationId,
  })
}, 20_000)

test('api allows sending and receiving messages using foreign IDs', async () => {
  const userId = utils.getUserFid()
  const conversationId = utils.getConversationFid()
  const client = await chat.Client.connect({ apiUrl, userId })

  await client.createConversation({ id: conversationId })

  await checkApiCanSendAndReceiveMessages({
    client,
    conversationId,
  })
}, 20_000)

test('api allows sending and receiving messages using remotly generated JWTs', async () => {
  const userId = utils.getUserFid()
  const conversationId = utils.getConversationFid()

  const client = await chat.Client.connect({ apiUrl, userId, encryptionKey })

  await client.getOrCreateConversation({ id: conversationId })

  await checkApiCanSendAndReceiveMessages({
    client,
    conversationId,
  })
}, 20_000)

test('api allows deleting a message', async () => {
  const client = await chat.Client.connect({ apiUrl })
  const { conversation } = await client.createConversation({})

  const signalListener = await client.listenConversation({ id: conversation.id })

  const [{ isBot, ...createdMessage }] = await Promise.all([
    utils.waitFor(signalListener, 'message_created'),
    client.createMessage({
      conversationId: conversation.id,
      payload: {
        type: 'text',
        text: 'hello world',
      },
    }),
  ])

  const { message: fetchedMessage } = await client.getMessage({
    id: createdMessage.id,
  })

  expect(fetchedMessage).toEqual(createdMessage)

  const [deletedMessage] = await Promise.all([
    utils.waitFor(signalListener, 'message_deleted'),
    client.deleteMessage({
      id: createdMessage.id,
    }),
  ])

  expect(deletedMessage.id).toEqual(createdMessage.id)

  await expect(
    client.getMessage({
      id: createdMessage.id,
    })
  ).rejects.toThrow(chat.ResourceNotFoundError)
}, 20_000)
