import { z } from '@botpress/sdk'
import { OutputMessageSchema, TrelloIDSchema } from '..'

export const addCardCommentOutputSchema = z
  .object({
    message: OutputMessageSchema,
    newCommentId: TrelloIDSchema.describe('Unique identifier of the newly created comment'),
  })
  .describe('Output schema for adding a comment to a card')
