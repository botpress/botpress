import { z } from '@botpress/sdk'
import { BoardSchema } from 'src/schemas/entities/board'

export const listListInputSchema = z
  .object({
    nextToken: BoardSchema.shape.id.describe('Unique identifier of the board that contains the lists'),
  })
  .describe('Input schema for getting all lists in a board')
