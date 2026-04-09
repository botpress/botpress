import * as errors from '../../gen/errors'
import { setSpanAttributes, SPAN_ATTRS } from '../../tracing'
import * as types from '../types'
import * as fid from './fid'
import * as model from './model'

export const createEvent: types.AuthenticatedOperations['createEvent'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.createEvent(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const { conversationId, payload } = req.body
  const { userId } = req.auth

  setSpanAttributes({ [SPAN_ATTRS.CONVERSATION_ID]: conversationId, [SPAN_ATTRS.USER_ID]: userId })

  const { participant } = await props.apiUtils.findParticipant({ id: conversationId, userId: req.auth.userId })
  if (!participant) {
    throw new errors.ForbiddenError("You are not a participant in this event's conversation")
  }

  const { event } = await props.client.createEvent({
    type: 'custom',
    conversationId,
    userId,
    payload: {
      userId,
      conversationId,
      payload,
    },
  })

  const res = await fidHandler.mapResponse({
    body: {
      event: model.mapEvent(event),
    },
  })

  await props.signals.emit(conversationId, {
    type: 'event_created',
    data: { ...res.body.event, isBot: false },
  })

  return res
}

export const getEvent: types.AuthenticatedOperations['getEvent'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.getEvent(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const { event } = await props.client.getEvent({ id: req.params.id })
  const { conversationId } = event.payload
  const { participant } = await props.apiUtils.findParticipant({ id: conversationId, userId: req.auth.userId })
  if (!participant) {
    throw new errors.ForbiddenError("You are not a participant in this event's conversation")
  }

  return fidHandler.mapResponse({
    body: {
      event: model.mapEvent(event),
    },
  })
}
