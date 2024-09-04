import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '..'

export const getListsByDisplayNameInputSchema = z
  .object({
    boardId: TrelloIDSchema.describe('Unique identifier of the board'),
    listName: z.string().describe('Display name of the list'),
  })
  .describe('Input schema for getting a list ID from its name')
