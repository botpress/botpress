import { z } from '@botpress/sdk'
import { OutputMessageSchema, TrelloIDSchema } from '..'

export const createCardOutputSchema = z
  .object({
    message: OutputMessageSchema,
    newCardId: TrelloIDSchema.describe('Unique identifier of the new card'),
  })
  .describe('Output schema for creating a card')
