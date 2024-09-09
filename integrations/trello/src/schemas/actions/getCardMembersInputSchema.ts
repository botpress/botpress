import { z } from '@botpress/sdk'
import { CardSchema } from '../entities/card'

export const getCardMembersInputSchema = z
  .object({
    cardId: CardSchema.shape.id.describe('Unique identifier of the card'),
  })
  .describe('Input schema for getting all members of a card')
