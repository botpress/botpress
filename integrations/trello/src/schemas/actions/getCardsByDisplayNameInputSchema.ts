import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '..'

export const getCardsByDisplayNameInputSchema = z
  .object({
    listId: TrelloIDSchema.describe('Unique identifier of the list'),
    cardName: z.string().describe('Display name of the card'),
  })
  .describe('Input schema for getting a card ID from its name')
