import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '..'

export const getListIdOutputSchema = z
  .object({
    lists: z.array(TrelloIDSchema.describe('Unique identifier of the list')),
  })
  .describe('Output schema for getting a list ID from its name')
