import { z } from '@botpress/sdk'
import BoardSchema from '../entities/Board'

export const getBoardIdOutputSchema = z
  .object({
    boards: z.array(BoardSchema),
  })
  .describe('Output schema for getting a board ID from its name')
