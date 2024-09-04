import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '../primitives/trelloId'

export const getBoardMembersByDisplayNameInputSchema = z
  .object({
    boardId: TrelloIDSchema.describe('Unique identifier of the board'),
    displayName: z.string().describe('Display name of the member'),
  })
  .describe('Input schema for getting a member from its name')
