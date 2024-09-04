import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '../primitives/trelloId'

export const getCardsInListInputSchema = z
  .object({
    listId: TrelloIDSchema.describe('Unique identifier of the list'),
  })
  .describe('Input schema for getting all cards in a list')
