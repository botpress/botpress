import { type IntegrationDefinitionProps } from '@botpress/sdk'
import { addAttachmentToCardEventSchema, deleteAttachmentFromCardEventSchema } from './card-attachment-events'
import {
  type CommentCardEvent,
  commentCardEventSchema,
  deleteCommentEventSchema,
  updateCommentEventSchema,
} from './card-comment-events'
import {
  createCardEventSchema,
  deleteCardEventSchema,
  updateCardEventSchema,
  voteOnCardEventSchema,
} from './card-events'
import { addLabelToCardEventSchema, removeLabelFromCardEventSchema } from './card-label-events'
import {
  createCheckItemEventSchema,
  deleteCheckItemEventSchema,
  updateCheckItemEventSchema,
  updateCheckItemStateOnCardEventSchema,
} from './checklist-events'
import { AllSupportedEvents, GenericWebhookEvent, genericWebhookEventSchema, TrelloEventType } from './common'
import { addMemberToCardEventSchema, removeMemberFromCardEventSchema } from './member-events'

export const events = {
  // ===============================
  //           Card Events
  // ===============================
  [TrelloEventType.CARD_CREATED]: {
    title: 'Card created',
    description: 'Triggered when a card is created',
    schema: createCardEventSchema.shape.action.shape.data,
  },
  [TrelloEventType.CARD_UPDATED]: {
    title: 'Card updated',
    description: 'Triggered when a card is updated',
    schema: updateCardEventSchema.shape.action.shape.data,
  },
  [TrelloEventType.CARD_DELETED]: {
    title: 'Card deleted',
    description: 'Triggered when a card is deleted',
    schema: deleteCardEventSchema.shape.action.shape.data,
  },
  [TrelloEventType.VOTE_ON_CARD]: {
    title: 'Vote on card',
    description: 'Triggered when a vote is added to a card',
    schema: voteOnCardEventSchema.shape.action.shape.data,
  },
  // ===============================
  //       Card Comment Events
  // ===============================
  [TrelloEventType.CARD_COMMENT_ADDED]: {
    title: 'Comment added to card',
    description: 'Triggered when a comment is added to a card',
    schema: commentCardEventSchema.shape.action.shape.data,
  },
  [TrelloEventType.CARD_COMMENT_UPDATED]: {
    title: 'Comment updated',
    description: 'Triggered when a comment is updated',
    schema: updateCommentEventSchema.shape.action.shape.data,
  },
  [TrelloEventType.CARD_COMMENT_DELETED]: {
    title: 'Comment deleted',
    description: 'Triggered when a comment is deleted',
    schema: deleteCommentEventSchema.shape.action.shape.data,
  },
  // ===============================
  //        Card Label Events
  // ===============================
  [TrelloEventType.LABEL_ADDED_TO_CARD]: {
    title: 'Label added to card',
    description: 'Triggered when a label is added to a card',
    schema: addLabelToCardEventSchema.shape.action.shape.data,
  },
  [TrelloEventType.LABEL_REMOVED_FROM_CARD]: {
    title: 'Label removed from card',
    description: 'Triggered when a label is removed from a card',
    schema: removeLabelFromCardEventSchema.shape.action.shape.data,
  },
  // ================================
  //      Card Attachment Events
  // ================================
  [TrelloEventType.ATTACHMENT_ADDED_TO_CARD]: {
    title: 'Attachment added to card',
    description: 'Triggered when an attachment is added to a card',
    schema: addAttachmentToCardEventSchema.shape.action.shape.data,
  },
  [TrelloEventType.ATTACHMENT_REMOVED_FROM_CARD]: {
    title: 'Attachment deleted from card',
    description: 'Triggered when an attachment is deleted from a card',
    schema: deleteAttachmentFromCardEventSchema.shape.action.shape.data,
  },
  // ================================
  //         Checklist Events
  // ================================
  [TrelloEventType.CHECKLIST_ITEM_CREATED]: {
    title: 'Check item created',
    description: 'Triggered when a check item is added to a checklist of a card',
    schema: createCheckItemEventSchema.shape.action.shape.data,
  },
  [TrelloEventType.CHECKLIST_ITEM_UPDATED]: {
    title: 'Check item updated',
    description: 'Triggered when a check item is modified in a checklist of a card',
    schema: updateCheckItemEventSchema.shape.action.shape.data,
  },
  [TrelloEventType.CHECKLIST_ITEM_DELETED]: {
    title: 'Check item deleted',
    description: 'Triggered when a check item is removed from a checklist of a card',
    schema: deleteCheckItemEventSchema.shape.action.shape.data,
  },
  [TrelloEventType.CHECKLIST_ITEM_STATUS_UPDATED]: {
    title: 'Check item state updated on card',
    description: 'Triggered when the state of a check item is updated in a checklist of a card',
    schema: updateCheckItemStateOnCardEventSchema.shape.action.shape.data,
  },
  // ===============================
  //          Member Events
  // ===============================
  [TrelloEventType.MEMBER_ADDED_TO_CARD]: {
    title: 'Member added to card',
    description: 'Triggered when a member is added to a card',
    schema: addMemberToCardEventSchema.shape.action.shape.data,
  },
  [TrelloEventType.MEMBER_REMOVED_FROM_CARD]: {
    title: 'Member removed from card',
    description: 'Triggered when a member is removed from a card',
    schema: removeMemberFromCardEventSchema.shape.action.shape.data,
  },
} as const satisfies NonNullable<IntegrationDefinitionProps['events']>

export {
  TrelloEventType,
  type AllSupportedEvents,
  type CommentCardEvent,
  commentCardEventSchema,
  type GenericWebhookEvent,
  genericWebhookEventSchema,
}
