import { TrelloEventType } from 'definitions/events'
import { WebhookEventPayload } from '../schemas'
import * as attachmentHandlers from './card-attachment-event-handlers'
import * as commentHandlers from './card-comment-event-handlers'
import * as cardHandlers from './card-event-handlers'
import * as labelHandlers from './card-label-event-handlers'
import * as checklistHandlers from './checklist-event-handlers'
import * as memberHandlers from './member-event-handlers'
import * as bp from '.botpress'

export const dispatchIntegrationEvent = async (props: bp.HandlerProps, eventPayload: WebhookEventPayload) => {
  const eventType = eventPayload.action.type
  switch (eventType) {
    case TrelloEventType.CARD_CREATED:
      return cardHandlers.handleCardCreatedEvent(props, eventType, eventPayload.action)
    case TrelloEventType.CARD_UPDATED:
      return cardHandlers.handleCardUpdatedEvent(props, eventType, eventPayload.action)
    case TrelloEventType.CARD_DELETED:
      return cardHandlers.handleCardDeletedEvent(props, eventType, eventPayload.action)
    case TrelloEventType.CARD_VOTES_UPDATED:
      return cardHandlers.handleCardVotesUpdatedEvent(props, eventType, eventPayload.action)
    case TrelloEventType.CARD_COMMENT_CREATED:
      return commentHandlers.handleCommentAddedEvent(props, eventType, eventPayload.action)
    case TrelloEventType.CARD_COMMENT_UPDATED:
      return commentHandlers.handleCommentUpdatedEvent(props, eventType, eventPayload.action)
    case TrelloEventType.CARD_COMMENT_DELETED:
      return commentHandlers.handleCommentDeletedEvent(props, eventType, eventPayload.action)
    case TrelloEventType.LABEL_ADDED_TO_CARD:
      return labelHandlers.handleLabelAddedToCardEvent(props, eventType, eventPayload.action)
    case TrelloEventType.LABEL_REMOVED_FROM_CARD:
      return labelHandlers.handleLabelRemovedFromCardEvent(props, eventType, eventPayload.action)
    case TrelloEventType.ATTACHMENT_ADDED_TO_CARD:
      return attachmentHandlers.handleAttachmentAddedEvent(props, eventType, eventPayload.action)
    case TrelloEventType.ATTACHMENT_REMOVED_FROM_CARD:
      return attachmentHandlers.handleAttachmentRemovedEvent(props, eventType, eventPayload.action)
    case TrelloEventType.CHECKLIST_ADDED_TO_CARD:
      return checklistHandlers.handleChecklistAddedToCardEvent(props, eventType, eventPayload.action)
    case TrelloEventType.CHECKLIST_ITEM_CREATED:
      return checklistHandlers.handleChecklistItemCreatedEvent(props, eventType, eventPayload.action)
    case TrelloEventType.CHECKLIST_ITEM_UPDATED:
      return checklistHandlers.handleChecklistItemUpdatedEvent(props, eventType, eventPayload.action)
    case TrelloEventType.CHECKLIST_ITEM_DELETED:
      return checklistHandlers.handleChecklistItemDeletedEvent(props, eventType, eventPayload.action)
    case TrelloEventType.CHECKLIST_ITEM_STATUS_UPDATED:
      return checklistHandlers.handleChecklistItemStatusUpdatedEvent(props, eventType, eventPayload.action)
    case TrelloEventType.MEMBER_ADDED_TO_CARD:
      return memberHandlers.handleMemberAddedToCardEvent(props, eventType, eventPayload.action)
    case TrelloEventType.MEMBER_REMOVED_FROM_CARD:
      return memberHandlers.handleMemberRemovedFromCardEvent(props, eventType, eventPayload.action)
    default:
      return null
  }
}
