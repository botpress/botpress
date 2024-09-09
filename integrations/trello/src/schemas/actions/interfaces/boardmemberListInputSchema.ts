import { z } from '@botpress/sdk'
import { BoardSchema } from 'src/schemas/entities/board'

export const boardmemberListInputSchema = z
  .object({
    nextToken: BoardSchema.shape.id.describe('Unique identifier of the board of which to retrieve the members'),
  })
  .describe('Input schema for getting all members of a board')
