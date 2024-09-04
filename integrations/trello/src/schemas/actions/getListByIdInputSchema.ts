import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '../primitives/trelloId'

export const getListByIdInputSchema = z
  .object({
    listId: TrelloIDSchema.describe('Unique identifier of the list'),
  })
  .describe('Input schema for getting a list from its ID')
