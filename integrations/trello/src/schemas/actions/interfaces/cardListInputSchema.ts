import { z } from '@botpress/sdk'
import { CardSchema } from 'src/schemas/entities/card'

export const cardListInputSchema = z
  .object({
    nextToken: CardSchema.shape.id.describe('Unique identifier of the list that contains the cards'),
  })
  .describe('Input schema for getting all cards in a list')
