import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '..'

export const addCardCommentInputSchema = z
  .object({
    cardId: TrelloIDSchema.describe('Unique identifier of the card to which a comment will be added'),
    commentBody: z.string().describe('The body text of the comment'),
  })
  .describe('Input schema for adding a comment to a card')
