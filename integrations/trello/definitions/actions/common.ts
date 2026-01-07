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
  message: z.string().describe('Output message'),
})

export const outputsMember = z.object({
  member: memberSchema.describe('The member object'),
})

export const outputsMembers = z.object({
  members: z.array(memberSchema).describe('Array of member objects'),
})

export const outputsCard = z.object({
  card: cardSchema.describe('The card object'),
})

export const outputsCards = z.object({
  cards: z.array(cardSchema).describe('Array of card objects'),
})

export const outputsList = z.object({
  list: listSchema.describe('The list object'),
})

export const outputsLists = z.object({
  lists: z.array(listSchema).describe('Array of list objects'),
})

export const outputsBoard = z.object({
  board: boardSchema.describe('The board object'),
})

export const outputsBoards = z.object({
  boards: z.array(boardSchema).describe('Array of board objects'),
})
