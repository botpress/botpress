import * as errors from '../../gen/errors'
import { validateFid } from '../../id-store'
import * as types from '../types'
import * as fid from './fid'
import * as model from './model'

export const createConversation: types.AuthenticatedOperations['createConversation'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.createConversation(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const {
    auth: { userId },
  } = req

  const { conversation } = await props.client.createConversation({
    channel: 'channel',
    tags: {
      owner: userId,
    },
  })

  await props.client.addParticipant({ id: conversation.id, userId })

  return fidHandler.mapResponse({
    body: {
      conversation: model.mapConversation(conversation),
    },
  })
}

export const getConversation: types.AuthenticatedOperations['getConversation'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.getConversation(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const { conversation } = await props.client.getConversation({ id: req.params.id })
  if (conversation.tags.owner !== req.auth.userId) {
    throw new errors.ForbiddenError('You are not the owner of this conversation')
  }

  return fidHandler.mapResponse({
    body: {
      conversation: model.mapConversation(conversation),
    },
  })
}

export const getOrCreateConversation: types.AuthenticatedOperations['getOrCreateConversation'] = async (
  props,
  foreignReq
) => {
  const {
    body: { id: conversationFid },
  } = foreignReq

  const userId = await props.userIdStore.byFid.get(foreignReq.auth.userId)
  const existingId = await props.convIdStore.byFid.find(conversationFid)

  if (existingId) {
    const { conversation } = await props.client.getConversation({ id: existingId })
    if (conversation.tags.owner !== userId) {
      throw new errors.ForbiddenError('You are not the owner of this conversation')
    }

    const res = {
      body: {
        conversation: model.mapConversation(conversation),
      },
    }

    return fid.merge(res, {
      body: {
        conversation: {
          id: conversationFid,
        },
      },
    })
  }

  const validationResult = validateFid(conversationFid)
  if (!validationResult.success) {
    throw new errors.InvalidPayloadError(validationResult.reason)
  }

  const { conversation } = await props.client.createConversation({
    channel: 'channel',
    tags: {
      owner: userId,
    },
  })

  const { id: conversationId } = conversation

  await props.client.addParticipant({ id: conversationId, userId })
  await props.convIdStore.byFid.set(conversationFid, conversationId)

  const res = {
    body: {
      conversation: model.mapConversation(conversation),
    },
  }

  return fid.merge(res, {
    body: {
      conversation: {
        id: conversationFid,
      },
    },
  })
}

export const deleteConversation: types.AuthenticatedOperations['deleteConversation'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.deleteConversation(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const { conversation } = await props.client.getConversation({ id: req.params.id })
  if (conversation.tags.owner !== req.auth.userId) {
    throw new errors.ForbiddenError('You are not the owner of this conversation')
  }

  await props.client.deleteConversation({ id: req.params.id })

  return fidHandler.mapResponse({ body: {} })
}

export const listConversations: types.AuthenticatedOperations['listConversations'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.listConversations(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const { conversations, meta } = await props.client.listConversations({
    nextToken: req.query.nextToken,
    tags: { owner: req.auth.userId },
  })

  return fidHandler.mapResponse({
    body: {
      conversations: conversations.map((c) => ({
        id: c.id,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      meta,
    },
  })
}

export const listMessages: types.AuthenticatedOperations['listMessages'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.listMessages(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const { nextToken } = req.query
  const { conversationId } = req.params

  const { participant } = await props.apiUtils.findParticipant({ id: conversationId, userId: req.auth.userId })
  if (!participant) {
    throw new errors.ForbiddenError('You are not a participant in this conversation')
  }

  const { messages, meta } = await props.client.listMessages({ conversationId, nextToken, tags: {} })

  return fidHandler.mapResponse({
    body: {
      messages: messages.map((m) => model.mapMessage(m as types.Message)),
      meta,
    },
  })
}

export const listenConversation: types.AuthenticatedOperations['listenConversation'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.listenConversation(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const userId = req.auth.userId
  const conversationId = req.params.id

  const { participant } = await props.apiUtils.findParticipant({ id: conversationId, userId })
  if (!participant) {
    throw new errors.ForbiddenError('You are not a participant in this conversation')
  }

  const body = {}
  const contentLength = Buffer.byteLength(JSON.stringify(body), 'utf-8')

  const keepAliveMessage = ['event: message', 'data: ping', '', ''].join('\n')
  const b64KeepAlive = Buffer.from(keepAliveMessage, 'utf-8').toString('base64')
  return fidHandler.mapResponse({
    body,
    headers: {
      'Content-Type': 'text/event-stream',
      'Content-Length': `${contentLength}`,
      'Grip-Hold': 'stream',
      'Grip-Channel': `${conversationId},${userId}`,
      'Grip-Keep-Alive': `${b64KeepAlive}; format=base64; timeout=30;`,
    },
  })
}

export const addParticipant: types.AuthenticatedOperations['addParticipant'] = async (props, foreignReq) => {
  const conversationFid = foreignReq.params.conversationId
  const userFid = foreignReq.body.userId

  const fidHandler = fid.handlers.addParticipant(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const userId = req.auth.userId
  const conversationId = req.params.conversationId
  const participantId = req.body.userId

  const {
    conversation: {
      tags: { owner },
    },
  } = await props.client.getConversation({ id: conversationId })
  if (owner !== userId) {
    throw new errors.ForbiddenError('You are not the owner of this conversation')
  }

  const { participant } = await props.client.addParticipant({
    id: conversationId,
    userId: participantId,
  })

  await props.signals.emit(conversationId, {
    type: 'participant_added',
    data: {
      conversationId: conversationFid,
      participantId: userFid,
    },
  })

  return fidHandler.mapResponse({
    body: {
      participant: model.mapUser(participant),
    },
  })
}

export const getParticipant: types.AuthenticatedOperations['getParticipant'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.getParticipant(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const {
    conversation: {
      tags: { owner },
    },
  } = await props.client.getConversation({ id: req.params.conversationId })
  if (owner !== req.auth.userId) {
    throw new errors.ForbiddenError('You are not the owner of this conversation')
  }

  const { participant } = await props.client.getParticipant({
    id: req.params.conversationId,
    userId: req.params.userId,
  })

  return fidHandler.mapResponse({
    body: {
      participant: model.mapUser(participant),
    },
  })
}

export const removeParticipant: types.AuthenticatedOperations['removeParticipant'] = async (props, foreignReq) => {
  const conversationFid = foreignReq.params.conversationId
  const userFid = foreignReq.params.userId

  const fidHandler = fid.handlers.removeParticipant(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const userId = req.auth.userId
  const conversationId = req.params.conversationId
  const participantId = req.params.userId

  const {
    conversation: {
      tags: { owner },
    },
  } = await props.client.getConversation({ id: conversationId })
  if (owner !== userId) {
    throw new errors.ForbiddenError('You are not the owner of this conversation')
  }

  if (participantId === owner) {
    throw new errors.InvalidPayloadError('You cannot remove yourself from the conversation because you are its owner')
  }

  await props.client.removeParticipant({
    id: conversationId,
    userId: participantId,
  })

  await props.signals.close(participantId)

  await props.signals.emit(conversationId, {
    type: 'participant_removed',
    data: {
      conversationId: conversationFid,
      participantId: userFid,
    },
  })

  return fidHandler.mapResponse({
    body: {},
  })
}

export const listParticipants: types.AuthenticatedOperations['listParticipants'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.listParticipants(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const {
    conversation: {
      tags: { owner },
    },
  } = await props.client.getConversation({ id: req.params.conversationId })
  if (owner !== req.auth.userId) {
    throw new errors.ForbiddenError('You are not the owner of this conversation')
  }

  const { users: participants, meta } = await props.client.listUsers({
    conversationId: req.params.conversationId,
    nextToken: req.query.nextToken,
    tags: {},
  })

  return fidHandler.mapResponse({
    body: {
      participants: participants.map(model.mapUser),
      meta,
    },
  })
}
