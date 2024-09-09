import { z } from '@botpress/sdk'
import { BoardSchema } from 'src/schemas/entities/board'

export const boardReadInputSchema = z
  .object({
    id: BoardSchema.shape.id.describe('Unique identifier of the board to retrieve'),
  })
  .describe('Input schema for getting a board by its ID')
