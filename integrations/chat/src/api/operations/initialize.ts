import { InvalidPayloadError } from 'src/gen/errors'
import * as msgPayload from '../message-payload'
import * as types from '../types'
import * as fid from './fid'
import * as model from './model'

export const initialize: types.Operations['initializeIncomingMessage'] = async (props, req) => {
  let userKey = req.headers['x-user-key']

  let userId: string | undefined
  if (userKey) {
    const parsedKey = props.auth.parseKey(userKey)
    userId = parsedKey.id
  }

  if ((!userId && !req.body.user) || (userId && req.body.user)) {
    throw new InvalidPayloadError('You have to set either the "x-user-key" header or the "user" body parameter.')
  }

  const fidHandler = fid.handlers.initializeIncomingMessage(props, {
    ...req,
    auth: { userId: userId ?? '' },
  })
  const request = await fidHandler.mapRequest()

  type InitializeIncomingMessageParams = Parameters<typeof props.client.initializeIncomingMessage>[0]

  type PreparedBody = {
    user?: InitializeIncomingMessageParams['user']
    userId?: string
    conversation?: InitializeIncomingMessageParams['conversation']
    conversationId?: string
    message?: InitializeIncomingMessageParams['message']
  }

  const preparedBody: PreparedBody = {}

  if (userId) preparedBody.userId = userId
  else {
    preparedBody.user = {
      ...request.body.user,
      tags: {},
      discriminateByTags: [],
    }
  }

  if (request.body.conversationId) {
    preparedBody.conversationId = request.body.conversationId
  } else {
    preparedBody.conversation = {
      channel: 'channel',
      tags: {},
      discriminateByTags: [],
    }
  }

  if (request.body.message) {
    const payload = msgPayload.mapChatMessageToBotpress({
      payload: request.body.message.payload,
      metadata: request.body.message.metadata,
    })
    preparedBody.message = { ...payload, tags: {}, discriminateByTags: [] }
  }

  const initializeResponse = await props.client.initializeIncomingMessage(preparedBody)

  const updateUserPromise = props.client.updateUser({
    id: initializeResponse.user.id,
    tags: { fid: userId ?? initializeResponse.user.id, profile: request.body.user?.profile },
  })
  const updateConversationPromise = await props.client.updateConversation({
    id: initializeResponse.conversation.id,
    tags: { owner: userId, fid: request.body.conversationId ?? initializeResponse.conversation.id },
  })

  await Promise.all([updateUserPromise, updateConversationPromise])

  if (!userKey) {
    userKey = props.auth.generateKey({ id: initializeResponse.user.id })
  }

  const res = await fidHandler.mapResponse({
    body: {
      ...initializeResponse,
      user: { ...initializeResponse.user, key: userKey },
      message: initializeResponse.message ? model.mapMessage(initializeResponse.message) : undefined,
    },
  })

  return res
}
