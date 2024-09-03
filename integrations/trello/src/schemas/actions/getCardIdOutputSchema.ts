import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '..'

export const getCardIdOutputSchema = z
  .object({
    lists: z.array(TrelloIDSchema.describe('Unique identifier of the card')),
  })
  .describe('Output schema for getting a card ID from its name')
