import { z } from '@botpress/sdk'
import { CardSchema } from 'src/schemas/entities/card'

export const cardmemberListInputSchema = z
  .object({
    nextToken: CardSchema.shape.id.describe('Unique identifier of the card of which to retrieve the members'),
  })
  .describe('Input schema for getting all members of a card')
