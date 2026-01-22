import { z } from '@botpress/sdk'
import { boardSchema, cardSchema, trelloIdSchema } from '../schemas'
import { botpressEventDataSchema, pickIdAndName } from './common'

export const labelSchema = z.object({
  id: trelloIdSchema.title('Label ID').describe('Unique identifier of the label'),
  name: z.string().title('Label Name').describe('Name of the label'),
  color: z.string().title('Label Color').describe('Color of the label'),
})

export const labelAddedToCardEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was modified'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was modified'),
  label: labelSchema.title('Label').describe('Label that was added to the card'),
})

export const labelRemovedFromCardEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was modified'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was modified'),
  label: labelSchema.title('Label').describe('Label that was removed from the card'),
})
