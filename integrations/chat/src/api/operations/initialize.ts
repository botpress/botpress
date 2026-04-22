import { InvalidPayloadError, UnauthorizedError } from 'src/gen/errors'
import * as msgPayload from '../message-payload'
import * as types from '../types'
import * as fid from './fid'
import * as model from './model'

export const initialize: types.Operations['initializeIncomingMessage'] = async (props, req) => {
  const userKeyHeader = req.headers['x-user-key']
  if ((!userKeyHeader && !req.body.user) || (userKeyHeader && req.body.user)) {
    throw new InvalidPayloadError('You have to set either the "x-user-key" header or the "user" body parameter.')
  }

  if (props.auth.mode === 'personal' && !req.headers['x-user-key']) {
    throw new UnauthorizedError(
      'The "initialize" operation can only create a user when using the shared encryption key.'
    )
  }

  const userId = userKeyHeader ? props.auth.parseKey(userKeyHeader).id : undefined

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

  // Determine how to pass the user to the Botpress API:
  //   Case A: No x-user-key header → create a new user (userId is undefined)
  //   Case B: x-user-key encodes a Botpress internal ID (user_<ULID>) → user was created via
  //           createUser({}) without an explicit FID; use the ID directly without a store lookup
  //   Case C: x-user-key encodes an external FID → look up in the store
  //           - If found: existing user, pass userId
  //           - If not found: brand-new FID, create a new user
  const INTERNAL_USER_ID_RE = /^user_[0-9A-HJKMNP-TV-Z]{26}$/
  const authUserId: string | undefined =
    userId !== undefined
      ? INTERNAL_USER_ID_RE.test(userId)
        ? userId // Case B: internal ID, no store lookup needed
        : await props.userIdStore.byFid.find(userId) // Case C: external FID
      : undefined // Case A: no key

  if (authUserId !== undefined) {
    preparedBody.userId = authUserId
  } else {
    preparedBody.user = {
      ...request.body.user,
      tags: { fid: userId, profile: request.body.user?.profile },
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
  if (!req.body.conversationId) {
    await props.client.updateConversation({
      id: initializeResponse.conversation.id,
      tags: {
        owner: initializeResponse.user.id,
        fid: request.body.conversationId ?? initializeResponse.conversation.id,
      },
    })
  }

  const userKey = userKeyHeader ?? props.auth.generateKey({ id: initializeResponse.user.id })

  const res = await fidHandler.mapResponse({
    body: {
      ...initializeResponse,
      user: { ...model.mapUser(initializeResponse.user), key: userKey },
      conversation: model.mapConversation(initializeResponse.conversation),
      message: initializeResponse.message ? model.mapMessage(initializeResponse.message) : undefined,
    },
  })

  return res
}
