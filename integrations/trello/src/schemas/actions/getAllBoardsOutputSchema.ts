import { z } from '@botpress/sdk'
import BoardSchema from '../entities/Board'

export const getAllBoardsOutputSchema = z
  .object({
    boards: z.array(BoardSchema),
  })
  .describe('Output schema for getting all boards')
