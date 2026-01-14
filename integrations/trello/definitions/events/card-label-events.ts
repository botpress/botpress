import { z } from '@botpress/sdk'
import { boardSchema, cardSchema, trelloIdSchema } from '../schemas'
import { genericWebhookEventSchema, pickIdAndName, TrelloEventType } from './common'

// Action that is triggered when a label is added to a card
export const addLabelToCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal(TrelloEventType.LABEL_ADDED_TO_CARD).title('Action Type').describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was modified'),
      card: pickIdAndName(cardSchema).title('Card').describe('Card that was modified'),
      label: z
        .object({
          id: trelloIdSchema.title('Label ID').describe('Unique identifier of the label'),
          name: z.string().title('Label Name').describe('Name of the label'),
          color: z.string().title('Label Color').describe('Color of the label'),
        })
        .title('Label')
        .describe('Label that was added to the card'),
    }),
  }),
})

// Action that is triggered when a label is removed from a card
export const removeLabelFromCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal(TrelloEventType.LABEL_REMOVED_FROM_CARD).describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was modified'),
      card: pickIdAndName(cardSchema).title('Card').describe('Card that was modified'),
      label: z
        .object({
          id: trelloIdSchema.title('Label ID').describe('Unique identifier of the label'),
          name: z.string().title('Label Name').describe('Name of the label'),
          color: z.string().title('Label Color').describe('Color of the label'),
        })
        .title('Label')
        .describe('Label that was removed from the card'),
    }),
  }),
})

// Action that is triggered when a user votes on a card
export const voteOnCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('voteOnCard').describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: pickIdAndName(cardSchema).optional().title('Card').describe('Card that was updated'),
      voted: z.boolean().title('Has Voted').describe('Whether the user voted on the card'),
    }),
  }),
})
