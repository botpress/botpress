import { z } from '@botpress/sdk'
import { boardSchema, cardSchema, trelloIdSchema } from '../schemas'
import { botpressEventDataSchema, pickIdAndName } from './common'

// Action that is triggered when a label is added to a card
export const addLabelToCardEventSchema = botpressEventDataSchema.extend({
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
})

// Action that is triggered when a label is removed from a card
export const removeLabelFromCardEventSchema = botpressEventDataSchema.extend({
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
})
