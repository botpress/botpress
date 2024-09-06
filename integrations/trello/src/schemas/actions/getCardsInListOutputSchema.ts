import { z } from '@botpress/sdk'
import { CardSchema } from '../entities/Card'

export const getCardsInListOutputSchema = z
  .object({
    cards: z.array(CardSchema),
  })
  .describe('Output schema for getting all cards in a list')
