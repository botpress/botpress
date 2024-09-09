import { z } from '@botpress/sdk'
import { createCardInputSchema } from '../createCardInputSchema'

export const cardCreateInputSchema = z
  .object({
    item: z.object({
      name: createCardInputSchema.shape.cardName,
      description: createCardInputSchema.shape.cardBody,
      listId: createCardInputSchema.shape.listId,
    }),
  })
  .describe('Input schema for creating a new card a card by its ID')
