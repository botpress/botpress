import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '../primitives/trelloId'

export const getCardByIdInputSchema = z
  .object({
    cardId: TrelloIDSchema.describe('Unique identifier of the card'),
  })
  .describe('Input schema for getting a card from its ID')
