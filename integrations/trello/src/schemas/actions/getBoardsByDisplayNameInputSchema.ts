import { z } from '@botpress/sdk'

export const getBoardsByDisplayNameInputSchema = z
  .object({
    boardName: z.string().describe('Display name of the board'),
  })
  .describe('Input schema for getting a board ID from its name')
