import { z } from '@botpress/sdk'
import { CardSchema } from 'src/schemas/entities/card'

export const cardReadInputSchema = z
  .object({
    id: CardSchema.shape.id.describe('Unique identifier of the card to retrieve'),
  })
  .describe('Input schema for getting a card by its ID')
