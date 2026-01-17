import { TrelloEventType } from 'definitions/events'
import { processInboundCommentChannelMessage } from '../handlers/card-comment'
import {
  CommentAddedWebhook,
  CommentDeletedWebhook,
  CommentUpdatedWebhook,
} from '../schemas/card-comment-event-schemas'
import { extractCommonEventData, extractIdAndName } from './helpers'
import * as bp from '.botpress'

export const handleCommentAddedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CARD_COMMENT_CREATED,
  webhookEvent: CommentAddedWebhook
) => {
  const result = await Promise.allSettled([
    processInboundCommentChannelMessage(props.client, webhookEvent),
    props.client.createEvent({
      type: eventType,
      payload: {
        ...extractCommonEventData(webhookEvent),
        board: extractIdAndName(webhookEvent.data.board),
        list: extractIdAndName(webhookEvent.data.list),
        card: extractIdAndName(webhookEvent.data.card),
        comment: {
          id: webhookEvent.id,
          text: webhookEvent.data.text,
        },
      },
    }),
  ])

  return result[1].status === 'fulfilled' ? result[1].value : null
}

export const handleCommentUpdatedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CARD_COMMENT_UPDATED,
  webhookEvent: CommentUpdatedWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(webhookEvent),
      board: extractIdAndName(webhookEvent.data.board),
      card: extractIdAndName(webhookEvent.data.card),
      comment: {
        id: webhookEvent.data.action.id,
        text: webhookEvent.data.action.text,
      },
      old: {
        text: webhookEvent.data.old.text,
      },
    },
  })
}

export const handleCommentDeletedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CARD_COMMENT_DELETED,
  webhookEvent: CommentDeletedWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(webhookEvent),
      board: extractIdAndName(webhookEvent.data.board),
      card: extractIdAndName(webhookEvent.data.card),
      comment: {
        id: webhookEvent.data.action.id,
      },
    },
  })
}
