import { z } from '@botpress/sdk'
import { BoardSchema } from '../entities/board'

export const getBoardByIdOutputSchema = z
  .object({
    board: BoardSchema,
  })
  .describe('Output schema for getting a board from its ID')
