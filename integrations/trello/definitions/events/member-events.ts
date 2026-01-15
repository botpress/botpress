import { z } from '@botpress/sdk'
import { boardSchema, cardSchema, memberSchema, trelloIdSchema } from '../schemas'
import { genericWebhookEventSchema, pickIdAndName, TrelloEventType } from './common'

// Action that is triggered when a member is added to a card
export const memberAddedToCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal(TrelloEventType.MEMBER_ADDED_TO_CARD).title('Action Type').describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: pickIdAndName(cardSchema).title('Card').describe('Card that the member was added to'),
      member: memberSchema.title('Member').describe('Member that was added to the card'),
    }),
  }),
})

// Action that is triggered when a member is removed from a card
export const memberRemovedFromCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal(TrelloEventType.MEMBER_REMOVED_FROM_CARD).describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
      member: z
        .object({
          id: trelloIdSchema.title('Member ID').describe('Unique identifier of the member'),
          name: z.string().title('Member Name').describe('Full name of the member'),
        })
        .title('Member')
        .describe('Member that was removed from the card'),
    }),
  }),
})
