import { z } from '@botpress/sdk'
import { boardSchema, listSchema, cardSchema, memberSchema } from 'definitions/schemas'

// ==== Common Input Schemas ====
export const noInput = z.object({})

export const hasBoardId = z.object({
  boardId: boardSchema.shape.id.title('Board ID').describe('Unique identifier of the board'),
})

export const hasListId = z.object({
  listId: listSchema.shape.id.title('List ID').describe('Unique identifier of the list'),
})

export const hasCardId = z.object({
  cardId: cardSchema.shape.id.title('Card ID').describe('Unique identifier of the card'),
})

// ==== Common Output Schemas ====
export const hasMessage = z.object({
  message: z.string().title('Output message').describe('Output message'),
})
