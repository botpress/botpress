import { expect, test } from 'vitest'
import _ from 'lodash'
import * as utils from './utils'
import * as config from './config'
import * as chat from '../src'

const apiUrl = config.get('API_URL')

test('api allows initializing a conversation, user and message', async () => {
  const client = new chat.Client({ apiUrl })

  const initializeResponse = await client.initializeIncomingMessage({
    user: {},
    message: { payload: { type: 'text', text: 'text' }, metadata: {} },
  })

  expect(initializeResponse).toMatchObject({
    conversation: expect.objectContaining({ id: expect.any(String) }),
    user: expect.objectContaining({ id: expect.any(String), key: expect.any(String) }),
    message: expect.objectContaining({
      id: expect.any(String),
      payload: { type: 'text', text: 'text' },
      metadata: {},
    }),
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

test('api allows creating the user first, then initializing conversation and message', async () => {
  const client = new chat.Client({ apiUrl })
  const user = await client.createUser({})

  const initializeResponse = await client.initializeIncomingMessage({
    'x-user-key': user.key,
    message: { payload: { type: 'text', text: 'hello' }, metadata: {} },
  })

  expect(initializeResponse.user.id).toBe(user.user.id)
  expect(initializeResponse.conversation).toEqual(expect.objectContaining({ id: expect.any(String) }))
  expect(initializeResponse.message).toMatchObject({
    id: expect.any(String),
    payload: { type: 'text', text: 'hello' },
    metadata: {},
  })
})

test('api allows creating the conversation first, then initializing message and user', async () => {
  const client = new chat.Client({ apiUrl })
  const user = await client.createUser({})
  const conversation = await client.createConversation({ 'x-user-key': user.key })

  const initializeResponse = await client.initializeIncomingMessage({
    'x-user-key': user.key,
    conversationId: conversation.conversation.id,
    message: { payload: { type: 'text', text: 'hi' }, metadata: {} },
  })

  expect(initializeResponse.user.id).toBe(user.user.id)
  expect(initializeResponse.conversation.id).toBe(conversation.conversation.id)
  expect(initializeResponse.message).toMatchObject({
    id: expect.any(String),
    payload: { type: 'text', text: 'hi' },
    metadata: {},
  })
})

test('api rejects reusing a self-encrypted user key with initialize', async () => {
  const encryptionKey = config.get('ENCRYPTION_KEY')
  const userId = utils.getUserFid()
  const client = await chat.Client.connect({ apiUrl, userId, encryptionKey })

  await expect(
    client.initializeIncomingMessage({
      message: { payload: { type: 'text', text: 'hi' }, metadata: {} },
    })
  ).rejects.toThrow()
})
