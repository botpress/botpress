import { z } from '@botpress/sdk'
import { boardSchema, cardSchema, listSchema, trelloIdSchema } from '../schemas'
import { genericWebhookEventSchema, pickIdAndName, TrelloEventType } from './common'

// Action that is triggered when a new comment is added to a card
export const commentCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal(TrelloEventType.CARD_COMMENT_ADDED).title('Action Type').describe('Type of the action'),
    id: trelloIdSchema.title('Comment ID').describe('Unique identifier of the comment'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
      list: pickIdAndName(listSchema).optional().title('List').describe('List where the card was updated'),
      text: z.string().title('Text').describe('Text of the comment'),
    }),
  }),
})
export type CommentCardEvent = z.infer<typeof commentCardEventSchema>

// Action that is triggered when a comment is updated
export const updateCommentEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal(TrelloEventType.CARD_COMMENT_UPDATED).describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
      list: pickIdAndName(listSchema).optional().title('List').describe('List where the card was updated'),
      action: z
        .object({
          id: trelloIdSchema.title('Comment ID').describe('Unique identifier of the comment that was updated'),
          text: z.string().title('Comment Text').describe('New text of the comment'),
        })
        .title('Action')
        .describe('The action details for the updated comment'),
      old: z
        .object({
          text: z.string().title('Old Comment Text').describe('Old text of the comment'),
        })
        .title('Old Comment')
        .describe('The previous data of the comment'),
    }),
  }),
})

// Action that is triggered when a comment is deleted from a card
export const deleteCommentEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal(TrelloEventType.CARD_COMMENT_DELETED).describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
      list: pickIdAndName(listSchema).optional().title('List').describe('List where the card was updated'),
      action: z
        .object({
          id: trelloIdSchema.title('Comment ID').describe('Unique identifier of the comment that was deleted'),
        })
        .title('Action')
        .describe('The action details for the deleted comment'),
    }),
  }),
})
