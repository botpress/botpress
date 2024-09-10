import { z } from '@botpress/sdk'
import { BoardSchema } from '../entities/board'

export const getBoardsByDisplayNameOutputSchema = z
  .object({
    boards: z.array(BoardSchema),
  })
  .describe('Output schema for getting a board from its name')
