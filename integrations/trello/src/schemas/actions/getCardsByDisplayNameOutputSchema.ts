import { z } from '@botpress/sdk'
import { CardSchema } from '../entities/card'

export const getCardsByDisplayNameOutputSchema = z
  .object({
    cards: z.array(CardSchema),
  })
  .describe('Output schema for getting a card ID from its name')
