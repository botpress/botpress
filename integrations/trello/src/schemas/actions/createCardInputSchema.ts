import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '..'

export const createCardInputSchema = z
  .object({
    listId: TrelloIDSchema.describe('ID of the list in which to insert the new card'),
    cardName: z.string().describe('Name of the new card'),
    cardBody: z.string().optional().describe('Body text of the new card'),
  })
  .describe('Input schema for creating a new card')
