import { z } from '@botpress/sdk'
import CardSchema from '../entities/Card'

export const getCardIdOutputSchema = z
  .object({
    cards: z.array(CardSchema),
  })
  .describe('Output schema for getting a card ID from its name')
