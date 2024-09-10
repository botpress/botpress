import { z } from '@botpress/sdk'
import { ListSchema } from '../entities/list'

export const getListsInBoardOutputSchema = z
  .object({
    lists: z.array(ListSchema),
  })
  .describe('Output schema for getting all lists in a board')
