import { expect, test } from 'vitest'
import _ from 'lodash'
import * as utils from './utils'
import * as config from './config'
import * as chat from '../src'

const apiUrl = config.get('API_URL')

test('api allows adding and removing conversation participants', async () => {
  const client = new chat.Client({ apiUrl })

  const { key: userKey1 } = await client.createUser({})
  const { user: user2, key: userKey2 } = await client.createUser({})

  const { conversation } = await client.createConversation({ 'x-user-key': userKey1 })

  const listener = await client.listenConversation({ id: conversation.id, 'x-user-key': userKey1 })

  await expect(
    client.createMessage({
      'x-user-key': userKey2,
      conversationId: conversation.id,
      payload: {
        type: 'text',
        text: 'hello world',
      },
    })
  ).rejects.toThrow(chat.ForbiddenError)

  await Promise.all([
    utils.waitFor(listener, 'participant_added'),
    client.addParticipant({
      'x-user-key': userKey1,
      conversationId: conversation.id,
      userId: user2.id,
    }),
  ])

  await expect(
    client.createMessage({
      'x-user-key': userKey2,
      conversationId: conversation.id,
      payload: {
        type: 'text',
        text: 'hello world',
      },
    })
  ).resolves.toBeTruthy()

  await Promise.all([
    utils.waitFor(listener, 'participant_removed'),
    client.removeParticipant({
      'x-user-key': userKey1,
      conversationId: conversation.id,
      userId: user2.id,
    }),
  ])

  await expect(
    client.createMessage({
      'x-user-key': userKey2,
      conversationId: conversation.id,
      payload: {
        type: 'text',
        text: 'hello world',
      },
    })
  ).rejects.toThrow(chat.ForbiddenError)
}, 20_000)

test('signal listener is disconnected when participant is removed', async () => {
  const client = new chat.Client({ apiUrl })

  const { user: user1, key: userKey1 } = await client.createUser({})
  const { user: user2, key: userKey2 } = await client.createUser({})

  const { conversation } = await client.createConversation({ 'x-user-key': userKey1 })
  await client.addParticipant({ 'x-user-key': userKey1, conversationId: conversation.id, userId: user2.id })

  const listener1 = await client.listenConversation({ id: conversation.id, 'x-user-key': userKey1 })
  const listener2 = await client.listenConversation({ id: conversation.id, 'x-user-key': userKey2 })

  const messages1: chat.Signals['message_created'][] = []
  const messages2: chat.Signals['message_created'][] = []

  listener1.on('message_created', (message) => messages1.push(message))
  listener2.on('message_created', (message) => messages2.push(message))

  await Promise.all([
    utils.waitFor(listener1, 'message_created'),
    client.createMessage({
      'x-user-key': userKey1,
      conversationId: conversation.id,
      payload: {
        type: 'text',
        text: 'foo',
      },
    }),
  ])

  await client.removeParticipant({ 'x-user-key': userKey1, conversationId: conversation.id, userId: user2.id })

  await Promise.all([
    utils.waitFor(listener1, 'message_created'),
    client.createMessage({
      'x-user-key': userKey1,
      conversationId: conversation.id,
      payload: {
        type: 'text',
        text: 'bar',
      },
    }),
  ])

  const incomingMessages1 = messages1.filter((m) => !m.isBot)
  const incomingMessages2 = messages2.filter((m) => !m.isBot)
  expect(incomingMessages1.length).toBe(2)
  expect(incomingMessages2.length).toBe(1)

  await listener1.disconnect()
  listener1.cleanup()

  await listener2.disconnect()
  listener2.cleanup()
}, 20_000)

test('api forbids removing owner from conversation participants', async () => {
  const client = new chat.Client({ apiUrl })

  const { user: user1, key: userKey1 } = await client.createUser({})

  const { conversation } = await client.createConversation({ 'x-user-key': userKey1 })

  await expect(
    client.removeParticipant({
      'x-user-key': userKey1,
      conversationId: conversation.id,
      userId: user1.id,
    })
  ).rejects.toThrow(chat.InvalidPayloadError)
})
