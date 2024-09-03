import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '..'

export const moveCardUpInputSchema = z.object({
  cardId: TrelloIDSchema.describe('Unique identifier of the card to move'),
  moveUpByNSpaces: z.number().min(1).describe('Number of spaces by which to move the card up').optional().default(1),
})
