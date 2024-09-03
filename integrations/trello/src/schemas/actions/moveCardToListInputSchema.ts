import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '..'

export const moveCardToListInputSchema = z.object({
  cardId: TrelloIDSchema.describe('Unique identifier of the card to move'),
  newListId: TrelloIDSchema.describe('Unique identifier of the list in which the card will be moved'),
})
