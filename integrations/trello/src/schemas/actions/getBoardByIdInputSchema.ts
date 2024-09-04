import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '../primitives/trelloId'

export const getBoardByIdInputSchema = z
  .object({
    boardId: TrelloIDSchema.describe('Unique identifier of the board'),
  })
  .describe('Input schema for getting a board from its ID')
