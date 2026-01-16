import { TrelloEventType } from 'definitions/events'
import { processInboundCommentChannelMessage } from '../channel-handlers/comments-channel-handler'
import {
  CommentAddedEventAction,
  CommentDeletedEventAction,
  CommentUpdatedEventAction,
} from '../schemas/card-comment-event-schemas'
import { extractCommonEventData, extractIdAndName } from './helpers'
import * as bp from '.botpress'

export const handleCommentAddedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CARD_COMMENT_CREATED,
  actionData: CommentAddedEventAction
) => {
  const result = await Promise.allSettled([
    processInboundCommentChannelMessage(props.client, actionData),
    props.client.createEvent({
      type: eventType,
      payload: {
        ...extractCommonEventData(actionData),
        board: extractIdAndName(actionData.data.board),
        list: extractIdAndName(actionData.data.list),
        card: extractIdAndName(actionData.data.card),
        comment: {
          id: actionData.id,
          text: actionData.data.text,
        },
      },
    }),
  ])

  return result[1].status === 'fulfilled' ? result[1].value : null
}

export const handleCommentUpdatedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CARD_COMMENT_UPDATED,
  actionData: CommentUpdatedEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(actionData),
      board: extractIdAndName(actionData.data.board),
      card: extractIdAndName(actionData.data.card),
      comment: {
        id: actionData.data.action.id,
        text: actionData.data.action.text,
      },
      old: {
        text: actionData.data.old.text,
      },
    },
  })
}

export const handleCommentDeletedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CARD_COMMENT_DELETED,
  actionData: CommentDeletedEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(actionData),
      board: extractIdAndName(actionData.data.board),
      card: extractIdAndName(actionData.data.card),
      comment: {
        id: actionData.data.action.id,
      },
    },
  })
}
