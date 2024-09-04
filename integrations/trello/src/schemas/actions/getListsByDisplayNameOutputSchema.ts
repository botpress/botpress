import { z } from '@botpress/sdk'
import ListSchema from '../entities/List'

export const getListsByDisplayNameOutputSchema = z
  .object({
    lists: z.array(ListSchema),
  })
  .describe('Output schema for getting a list ID from its name')
