import { InvalidPayloadError } from 'src/gen/errors'
import * as msgPayload from '../message-payload'
import * as types from '../types'
import * as fid from './fid'
import * as model from './model'
import { Client } from '.botpress'

type User = Parameters<Client['initializeIncomingMessage']>[0]['user']
type Conversation = Parameters<Client['initializeIncomingMessage']>[0]['conversation']
type Message = NonNullable<Parameters<Client['initializeIncomingMessage']>[0]['message']>

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

  const userRequest: { user?: User; userId?: string } = {}
  if (userId) {
    userRequest.userId = userId
  } else {
    userRequest.user = {
      ...request.body.user,
      tags: {},
      discriminateByTags: [],
    }
  }

  const conversationRequest: { conversationId?: string; conversation?: Conversation } = {}
  if (request.body.conversationId) {
    conversationRequest.conversationId = request.body.conversationId
  } else {
    conversationRequest.conversation = {
      channel: 'channel',
      tags: {},
      discriminateByTags: [],
    }
  }

  let msg: { message?: Message } = {}
  if (request.body.message) {
    const payload = msgPayload.mapChatMessageToBotpress({
      payload: request.body.message.payload,
      metadata: request.body.message.metadata,
    })
    msg = { message: { ...payload, tags: {}, discriminateByTags: [] } }
  }
  const preparedBody = {
    ...conversationRequest,
    ...userRequest,
    ...msg,
  }

  const initializeResponse = await props.client.initializeIncomingMessage(preparedBody)

  const updateConversationResponse = await props.client.updateConversation({
    id: initializeResponse.conversation.id,
    tags: { owner: userId, fid: request.body.conversationId ?? initializeResponse.conversation.id },
  })
  const updateUserResponse = await props.client.updateUser({
    id: initializeResponse.user.id,
    tags: { fid: userId ?? initializeResponse.user.id, profile: request.body.user?.profile },
  })

  if (!userKey) {
    userKey = props.auth.generateKey({ id: initializeResponse.user.id })
  }

  const res = await fidHandler.mapResponse({
    body: {
      ...initializeResponse,
      message: initializeResponse.message ? model.mapMessage(initializeResponse.message) : undefined,
    },
  })

  return res
}
