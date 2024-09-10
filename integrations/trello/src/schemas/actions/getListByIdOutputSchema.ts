import { z } from '@botpress/sdk'
import { ListSchema } from '../entities/list'

export const getListByIdOutputSchema = z
  .object({
    list: ListSchema,
  })
  .describe('Output schema for getting a list from its ID')
