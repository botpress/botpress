import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '..'

export const getBoardIdOutputSchema = z
  .object({
    boards: z.array(TrelloIDSchema.describe('Unique identifier of the board')),
  })
  .describe('Output schema for getting a board ID from its name')
