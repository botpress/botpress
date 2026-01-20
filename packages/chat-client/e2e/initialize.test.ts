import { expect, test } from 'vitest'
import _ from 'lodash'
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
