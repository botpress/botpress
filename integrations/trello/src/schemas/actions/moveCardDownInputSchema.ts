import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '..'

export const moveCardDownInputSchema = z.object({
  cardId: TrelloIDSchema.describe('Unique identifier of the card to move'),
  moveDownByNSpaces: z
    .number()
    .min(1)
    .describe('Number of spaces by which to move the card down')
    .optional()
    .default(1),
})
