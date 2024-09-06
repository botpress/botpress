import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '../../primitives/trelloId'

export const cardListInputSchema = z
  .object({
    nextToken: TrelloIDSchema.describe('Unique identifier of the list that contains the cards'),
  })
  .describe('Input schema for getting all cards in a list')
