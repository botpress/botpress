import { type IntegrationDefinitionProps } from '@botpress/sdk'
import { attachmentAddedToCardEventSchema, attachmentRemovedFromCardEventSchema } from './card-attachment-events'
import {
  cardCommentCreatedEventSchema,
  cardCommentDeletedEventSchema,
  cardCommentUpdatedEventSchema,
} from './card-comment-events'
import {
  cardCreatedEventSchema,
  cardDeletedEventSchema,
  cardUpdatedEventSchema,
  cardVotesUpdatedEventSchema,
} from './card-events'
import { labelAddedToCardEventSchema, labelRemovedFromCardEventSchema } from './card-label-events'
import {
  checklistAddedToCardEventSchema,
  checklistItemCreatedEventSchema,
  checklistItemDeletedEventSchema,
  checklistItemUpdatedEventSchema,
  checklistItemStatusUpdatedEventSchema,
} from './checklist-events'
import { CommonEventData, TrelloEventType } from './common'
import { memberAddedToCardEventSchema, memberRemovedFromCardEventSchema } from './member-events'

export const events = {
  // ===============================
  //           Card Events
  // ===============================
  [TrelloEventType.CARD_CREATED]: {
    title: 'Card Created',
    description: 'Triggered when a card is created',
    schema: cardCreatedEventSchema,
  },
  [TrelloEventType.CARD_UPDATED]: {
    title: 'Card Updated',
    description: 'Triggered when a card is updated',
    schema: cardUpdatedEventSchema,
  },
  [TrelloEventType.CARD_DELETED]: {
    title: 'Card Deleted',
    description: 'Triggered when a card is deleted',
    schema: cardDeletedEventSchema,
  },
  [TrelloEventType.CARD_VOTES_UPDATED]: {
    title: 'Card Votes Updated',
    description: 'Triggered when a vote is added to or removed from a card',
    schema: cardVotesUpdatedEventSchema,
  },
  // ===============================
  //       Card Comment Events
  // ===============================
  [TrelloEventType.CARD_COMMENT_CREATED]: {
    title: 'Comment Created',
    description: 'Triggered when a comment is added to a card',
    schema: cardCommentCreatedEventSchema,
  },
  [TrelloEventType.CARD_COMMENT_UPDATED]: {
    title: 'Comment Updated',
    description: 'Triggered when a comment is updated on a card',
    schema: cardCommentUpdatedEventSchema,
  },
  [TrelloEventType.CARD_COMMENT_DELETED]: {
    title: 'Comment Deleted',
    description: 'Triggered when a comment is deleted from a card',
    schema: cardCommentDeletedEventSchema,
  },
  // ===============================
  //        Card Label Events
  // ===============================
  [TrelloEventType.LABEL_ADDED_TO_CARD]: {
    title: 'Card Label Added',
    description: 'Triggered when a label is added to a card',
    schema: labelAddedToCardEventSchema,
  },
  [TrelloEventType.LABEL_REMOVED_FROM_CARD]: {
    title: 'Card Label Removed',
    description: 'Triggered when a label is removed from a card',
    schema: labelRemovedFromCardEventSchema,
  },
  // ================================
  //      Card Attachment Events
  // ================================
  [TrelloEventType.ATTACHMENT_ADDED_TO_CARD]: {
    title: 'Card Attachment Added',
    description: 'Triggered when an attachment is added to a card',
    schema: attachmentAddedToCardEventSchema,
  },
  [TrelloEventType.ATTACHMENT_REMOVED_FROM_CARD]: {
    title: 'Card Attachment Removed',
    description: 'Triggered when an attachment is removed from a card',
    schema: attachmentRemovedFromCardEventSchema,
  },
  // ================================
  //         Checklist Events
  // ================================
  [TrelloEventType.CHECKLIST_ADDED_TO_CARD]: {
    title: 'Checklist Added To Card',
    description: 'Triggered when a checklist is added to a card',
    schema: checklistAddedToCardEventSchema,
  },
  [TrelloEventType.CHECKLIST_ITEM_CREATED]: {
    title: 'Checklist Item Created',
    description: 'Triggered when a checklist item is added to a card',
    schema: checklistItemCreatedEventSchema,
  },
  [TrelloEventType.CHECKLIST_ITEM_UPDATED]: {
    title: 'Checklist Item Updated',
    description: 'Triggered when a checklist item is modified on a card',
    schema: checklistItemUpdatedEventSchema,
  },
  [TrelloEventType.CHECKLIST_ITEM_DELETED]: {
    title: 'Checklist Item Deleted',
    description: 'Triggered when a checklist item is removed from a card',
    schema: checklistItemDeletedEventSchema,
  },
  [TrelloEventType.CHECKLIST_ITEM_STATUS_UPDATED]: {
    title: 'Checklist Item Completion Updated',
    description: 'Triggered when the completion status of a checklist item is updated',
    schema: checklistItemStatusUpdatedEventSchema,
  },
  // ===============================
  //          Member Events
  // ===============================
  [TrelloEventType.MEMBER_ADDED_TO_CARD]: {
    title: 'Member Added To Card',
    description: 'Triggered when a member is added to a card',
    schema: memberAddedToCardEventSchema,
  },
  [TrelloEventType.MEMBER_REMOVED_FROM_CARD]: {
    title: 'Member Removed From Card',
    description: 'Triggered when a member is removed from a card',
    schema: memberRemovedFromCardEventSchema,
  },
} as const satisfies NonNullable<IntegrationDefinitionProps['events']>

export { TrelloEventType, type CommonEventData }
