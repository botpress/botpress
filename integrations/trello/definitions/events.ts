import { addAttachmentToCardEventSchema } from '../src/schemas/webhookEvents/addAttachmentToCardEventSchema'
import { addLabelToCardEventSchema } from '../src/schemas/webhookEvents/addLabelToCardEventSchema'
import { addMemberToCardEventSchema } from '../src/schemas/webhookEvents/addMemberToCardEventSchema'
import { commentCardEventSchema } from '../src/schemas/webhookEvents/commentCardEventSchema'
import { createCardEventSchema } from '../src/schemas/webhookEvents/createCardEventSchema'
import { createCheckItemEventSchema } from '../src/schemas/webhookEvents/createCheckItemEventSchema'
import { deleteAttachmentFromCardEventSchema } from '../src/schemas/webhookEvents/deleteAttachmentFromCardEventSchema'
import { deleteCardEventSchema } from '../src/schemas/webhookEvents/deleteCardEventSchema'
import { deleteCheckItemEventSchema } from '../src/schemas/webhookEvents/deleteCheckItemEventSchema'
import { deleteCommentEventSchema } from '../src/schemas/webhookEvents/deleteCommentEventSchema'
import { removeLabelFromCardEventSchema } from '../src/schemas/webhookEvents/removeLabelFromCardEventSchema'
import { removeMemberFromCardEventSchema } from '../src/schemas/webhookEvents/removeMemberFromCardEventSchema'
import { updateCardEventSchema } from '../src/schemas/webhookEvents/updateCardEventSchema'
import { updateCheckItemEventSchema } from '../src/schemas/webhookEvents/updateCheckItemEventSchema'
import { updateCheckItemStateOnCardEventSchema } from '../src/schemas/webhookEvents/updateCheckItemStateOnCardEventSchema'
import { updateCommentEventSchema } from '../src/schemas/webhookEvents/updateCommentEventSchema'
import { voteOnCardEventSchema } from '../src/schemas/webhookEvents/voteOnCardEventSchema'

export const events = {
  addMemberToCard: {
    title: 'Member added to card',
    description: 'Triggered when a member is added to a card',
    schema: addMemberToCardEventSchema.shape.action.shape.data,
  },
  commentCard: {
    title: 'Comment added to card',
    description: 'Triggered when a comment is added to a card',
    schema: commentCardEventSchema.shape.action.shape.data,
  },
  createCard: {
    title: 'Card created',
    description: 'Triggered when a card is created',
    schema: createCardEventSchema.shape.action.shape.data,
  },
  deleteCard: {
    title: 'Card deleted',
    description: 'Triggered when a card is deleted',
    schema: deleteCardEventSchema.shape.action.shape.data,
  },
  removeMemberFromCard: {
    title: 'Member removed from card',
    description: 'Triggered when a member is removed from a card',
    schema: removeMemberFromCardEventSchema.shape.action.shape.data,
  },
  updateCard: {
    title: 'Card updated',
    description: 'Triggered when a card is updated',
    schema: updateCardEventSchema.shape.action.shape.data,
  },
  updateCheckItemStateOnCard: {
    title: 'Check item state updated on card',
    description: 'Triggered when the state of a check item is updated in a checklist of a card',
    schema: updateCheckItemStateOnCardEventSchema.shape.action.shape.data,
  },
  addLabelToCard: {
    title: 'Label added to card',
    description: 'Triggered when a label is added to a card',
    schema: addLabelToCardEventSchema.shape.action.shape.data,
  },
  createCheckItem: {
    title: 'Check item created',
    description: 'Triggered when a check item is added to a checklist of a card',
    schema: createCheckItemEventSchema.shape.action.shape.data,
  },
  deleteCheckItem: {
    title: 'Check item deleted',
    description: 'Triggered when a check item is removed from a checklist of a card',
    schema: deleteCheckItemEventSchema.shape.action.shape.data,
  },
  deleteComment: {
    title: 'Comment deleted',
    description: 'Triggered when a comment is deleted',
    schema: deleteCommentEventSchema.shape.action.shape.data,
  },
  removeLabelFromCard: {
    title: 'Label removed from card',
    description: 'Triggered when a label is removed from a card',
    schema: removeLabelFromCardEventSchema.shape.action.shape.data,
  },
  updateCheckItem: {
    title: 'Check item updated',
    description: 'Triggered when a check item is modified in a checklist of a card',
    schema: updateCheckItemEventSchema.shape.action.shape.data,
  },
  updateComment: {
    title: 'Comment updated',
    description: 'Triggered when a comment is updated',
    schema: updateCommentEventSchema.shape.action.shape.data,
  },
  voteOnCard: {
    title: 'Vote on card',
    description: 'Triggered when a vote is added to a card',
    schema: voteOnCardEventSchema.shape.action.shape.data,
  },
  addAttachmentToCard: {
    title: 'Attachment added to card',
    description: 'Triggered when an attachment is added to a card',
    schema: addAttachmentToCardEventSchema.shape.action.shape.data,
  },
  deleteAttachmentFromCard: {
    title: 'Attachment deleted from card',
    description: 'Triggered when an attachment is deleted from a card',
    schema: deleteAttachmentFromCardEventSchema.shape.action.shape.data,
  },
}

export default events
