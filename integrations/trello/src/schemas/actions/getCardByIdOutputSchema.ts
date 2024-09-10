import { z } from '@botpress/sdk'
import { CardSchema } from '../entities/card'

export const getCardByIdOutputSchema = z
  .object({
    card: CardSchema,
  })
  .describe('Output schema for getting a card from its ID')
