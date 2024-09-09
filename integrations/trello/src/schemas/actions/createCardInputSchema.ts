import { z } from '@botpress/sdk'
import { CardSchema } from '../entities/card'
import { ListSchema } from '../entities/list'

export const createCardInputSchema = z
  .object({
    listId: ListSchema.shape.id.describe('ID of the list in which to insert the new card'),
    cardName: CardSchema.shape.name.min(1).max(16384).describe('Name of the new card'),
    cardBody: CardSchema.shape.description.max(16384).optional().describe('Body text of the new card'),
  })
  .describe('Input schema for creating a new card')
