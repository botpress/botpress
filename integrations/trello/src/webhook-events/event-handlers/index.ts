import { TrelloEventType } from 'definitions/events'
import { WebhookEventPayload } from '../schemas'
import * as attachmentHandlers from './card-attachment-event-handlers'
import * as commentHandlers from './card-comment-event-handlers'
import * as cardHandlers from './card-event-handlers'
import * as labelHandlers from './card-label-event-handlers'
import * as checklistHandlers from './checklist-event-handlers'
import * as memberHandlers from './member-event-handlers'
import * as bp from '.botpress'

export const dispatchIntegrationEvent = async (props: bp.HandlerProps, webhookEvent: WebhookEventPayload) => {
  const webhookEventType = webhookEvent.action.type
  switch (webhookEventType) {
    case TrelloEventType.CARD_CREATED:
      return cardHandlers.handleCardCreatedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CARD_UPDATED:
      return cardHandlers.handleCardUpdatedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CARD_DELETED:
      return cardHandlers.handleCardDeletedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CARD_VOTES_UPDATED:
      return cardHandlers.handleCardVotesUpdatedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CARD_COMMENT_CREATED:
      return commentHandlers.handleCommentAddedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CARD_COMMENT_UPDATED:
      return commentHandlers.handleCommentUpdatedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CARD_COMMENT_DELETED:
      return commentHandlers.handleCommentDeletedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.LABEL_ADDED_TO_CARD:
      return labelHandlers.handleLabelAddedToCardEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.LABEL_REMOVED_FROM_CARD:
      return labelHandlers.handleLabelRemovedFromCardEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.ATTACHMENT_ADDED_TO_CARD:
      return attachmentHandlers.handleAttachmentAddedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.ATTACHMENT_REMOVED_FROM_CARD:
      return attachmentHandlers.handleAttachmentRemovedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CHECKLIST_ADDED_TO_CARD:
      return checklistHandlers.handleChecklistAddedToCardEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CHECKLIST_ITEM_CREATED:
      return checklistHandlers.handleChecklistItemCreatedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CHECKLIST_ITEM_UPDATED:
      return checklistHandlers.handleChecklistItemUpdatedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CHECKLIST_ITEM_DELETED:
      return checklistHandlers.handleChecklistItemDeletedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.CHECKLIST_ITEM_STATUS_UPDATED:
      return checklistHandlers.handleChecklistItemStatusUpdatedEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.MEMBER_ADDED_TO_CARD:
      return memberHandlers.handleMemberAddedToCardEvent(props, webhookEventType, webhookEvent.action)
    case TrelloEventType.MEMBER_REMOVED_FROM_CARD:
      return memberHandlers.handleMemberRemovedFromCardEvent(props, webhookEventType, webhookEvent.action)
    default:
      return null
  }
}
