import * as errors from '../../gen/errors'
import * as types from '../types'
import * as fid from './fid'
import * as model from './model'

export const createMessage: types.AuthenticatedOperations['createMessage'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.createMessage(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const { conversationId, payload, metadata } = req.body
  const { userId } = req.auth

  const { participant } = await props.apiUtils.findParticipant({ id: conversationId, userId: req.auth.userId })
  if (!participant) {
    throw new errors.ForbiddenError("You are not a participant in this message's conversation")
  }

  const { message } = await props.client.createMessage({
    type: payload.type,
    conversationId,
    tags: {},
    userId,
    payload: {
      ...payload,
      metadata,
    },
  })

  const res = await fidHandler.mapResponse({
    body: {
      message: model.mapMessage(message),
    },
  })

  await props.signals.emit(conversationId, {
    type: 'message_created',
    data: { ...res.body.message, isBot: false },
  })

  return res
}

export const getMessage: types.AuthenticatedOperations['getMessage'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.getMessage(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const { message } = await props.client.getMessage({ id: req.params.id })
  const { conversationId } = message
  const { participant } = await props.apiUtils.findParticipant({ id: conversationId, userId: req.auth.userId })
  if (!participant) {
    throw new errors.ForbiddenError("You are not a participant in this message's conversation")
  }

  return fidHandler.mapResponse({
    body: {
      message: model.mapMessage(message),
    },
  })
}

export const deleteMessage: types.AuthenticatedOperations['deleteMessage'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.deleteMessage(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const { id } = req.params

  const { message } = await props.client.getMessage({ id })
  if (message.userId !== req.auth.userId) {
    throw new errors.ForbiddenError('You are not the sender of this message')
  }

  await props.client.deleteMessage({ id })

  await props.signals.emit(message.conversationId, {
    type: 'message_deleted',
    data: {
      id: message.id,
      conversationId: message.conversationId,
      userId: message.userId,
    },
  })

  return fidHandler.mapResponse({ body: {} })
}
