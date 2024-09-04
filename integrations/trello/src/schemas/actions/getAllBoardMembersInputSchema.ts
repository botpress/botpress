import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '../primitives/trelloId'

export const getAllBoardMembersInputSchema = z
  .object({
    boardId: TrelloIDSchema.describe('Unique identifier of the board'),
  })
  .describe('Input schema for getting all members of a board')
