import { TrelloEventType } from 'definitions/events'
import { WebhookEvent } from '../schemas'
import * as commentHandlers from './card-comment-event-handlers'
import * as cardHandlers from './card-event-handlers'
import * as bp from '.botpress'

export const dispatchIntegrationEvent = async (props: bp.HandlerProps, webhookEvent: WebhookEvent) => {
  const webhookEventType = webhookEvent.action.type
  switch (webhookEventType) {
    case TrelloEventType.CARD_CREATED:
      return cardHandlers.handleCardCreatedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CARD_UPDATED:
      return cardHandlers.handleCardUpdatedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CARD_DELETED:
      return cardHandlers.handleCardDeletedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.VOTE_ON_CARD:
      return cardHandlers.handleCardVotesUpdatedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CARD_COMMENT_ADDED:
      return commentHandlers.handleCommentAddedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CARD_COMMENT_UPDATED:
      return commentHandlers.handleCommentUpdatedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CARD_COMMENT_DELETED:
      return commentHandlers.handleCommentDeletedEvent(props, webhookEventType, webhookEvent.action)
    default:
      return null
  }
}
