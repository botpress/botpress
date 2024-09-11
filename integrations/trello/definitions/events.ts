import { IntegrationDefinitionProps } from '@botpress/sdk'
import {
  TRELLO_EVENTS,
  addMemberToCardEventSchema,
  commentCardEventSchema,
  createCardEventSchema,
  deleteCardEventSchema,
  removeMemberFromCardEventSchema,
  updateCardEventSchema,
  updateCheckItemStateOnCardEventSchema,
  addLabelToCardEventSchema,
  createCheckItemEventSchema,
  deleteCheckItemEventSchema,
  deleteCommentEventSchema,
  removeLabelFromCardEventSchema,
  updateCheckItemEventSchema,
  updateCommentEventSchema,
  voteOnCardEventSchema,
  addAttachmentToCardEventSchema,
  deleteAttachmentFromCardEventSchema,
} from './schemas/webhookEvents'

export const events = {
  [TRELLO_EVENTS.addMemberToCard]: {
    title: 'Member added to card',
    description: 'Triggered when a member is added to a card',
    schema: addMemberToCardEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.commentCard]: {
    title: 'Comment added to card',
    description: 'Triggered when a comment is added to a card',
    schema: commentCardEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.createCard]: {
    title: 'Card created',
    description: 'Triggered when a card is created',
    schema: createCardEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.deleteCard]: {
    title: 'Card deleted',
    description: 'Triggered when a card is deleted',
    schema: deleteCardEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.removeMemberFromCard]: {
    title: 'Member removed from card',
    description: 'Triggered when a member is removed from a card',
    schema: removeMemberFromCardEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.updateCard]: {
    title: 'Card updated',
    description: 'Triggered when a card is updated',
    schema: updateCardEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.updateCheckItemStateOnCard]: {
    title: 'Check item state updated on card',
    description: 'Triggered when the state of a check item is updated in a checklist of a card',
    schema: updateCheckItemStateOnCardEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.addLabelToCard]: {
    title: 'Label added to card',
    description: 'Triggered when a label is added to a card',
    schema: addLabelToCardEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.createCheckItem]: {
    title: 'Check item created',
    description: 'Triggered when a check item is added to a checklist of a card',
    schema: createCheckItemEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.deleteCheckItem]: {
    title: 'Check item deleted',
    description: 'Triggered when a check item is removed from a checklist of a card',
    schema: deleteCheckItemEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.deleteComment]: {
    title: 'Comment deleted',
    description: 'Triggered when a comment is deleted',
    schema: deleteCommentEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.removeLabelFromCard]: {
    title: 'Label removed from card',
    description: 'Triggered when a label is removed from a card',
    schema: removeLabelFromCardEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.updateCheckItem]: {
    title: 'Check item updated',
    description: 'Triggered when a check item is modified in a checklist of a card',
    schema: updateCheckItemEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.updateComment]: {
    title: 'Comment updated',
    description: 'Triggered when a comment is updated',
    schema: updateCommentEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.voteOnCard]: {
    title: 'Vote on card',
    description: 'Triggered when a vote is added to a card',
    schema: voteOnCardEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.addAttachmentToCard]: {
    title: 'Attachment added to card',
    description: 'Triggered when an attachment is added to a card',
    schema: addAttachmentToCardEventSchema.shape.action.shape.data,
  },
  [TRELLO_EVENTS.deleteAttachmentFromCard]: {
    title: 'Attachment deleted from card',
    description: 'Triggered when an attachment is deleted from a card',
    schema: deleteAttachmentFromCardEventSchema.shape.action.shape.data,
  },
} as const satisfies NonNullable<IntegrationDefinitionProps['events']>

export { TRELLO_EVENTS }
