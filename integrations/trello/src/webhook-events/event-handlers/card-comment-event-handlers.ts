import { TrelloEventType } from 'definitions/events'
import { processInboundCommentChannelMessage } from '../channel-handlers/comment-channel-handler'
import {
  CommentAddedWebhook,
  CommentDeletedWebhook,
  CommentUpdatedWebhook,
} from '../schemas/card-comment-webhook-schemas'
import { extractCommonEventData, extractIdAndName } from './helpers'
import { Expect, IsWebhookHandler } from './types'
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
type _HandleCommentAddedEventTest = Expect<IsWebhookHandler<typeof handleCommentAddedEvent>>

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
type _HandleCommentUpdatedEventTest = Expect<IsWebhookHandler<typeof handleCommentUpdatedEvent>>

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
type _HandleCommentDeletedEventTest = Expect<IsWebhookHandler<typeof handleCommentDeletedEvent>>
