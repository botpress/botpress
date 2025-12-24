import { z } from '@botpress/sdk'
import { trelloIdSchema, boardSchema, cardSchema, listSchema, memberSchema } from '../entities'

const GENERIC_SCHEMAS = {
  hasMessage: z.object({
    message: z.string().describe('Output message'),
  }),
  outputsMember: z.object({
    member: memberSchema.describe('The member object'),
  }),
  outputsMembers: z.object({
    members: z.array(memberSchema).describe('Array of member objects'),
  }),
  outputsCard: z.object({
    card: cardSchema.describe('The card object'),
  }),
  outputsCards: z.object({
    cards: z.array(cardSchema).describe('Array of card objects'),
  }),
  outputsList: z.object({
    list: listSchema.describe('The list object'),
  }),
  outputsLists: z.object({
    lists: z.array(listSchema).describe('Array of list objects'),
  }),
  outputsBoard: z.object({
    board: boardSchema.describe('The board object'),
  }),
  outputsBoards: z.object({
    boards: z.array(boardSchema).describe('Array of board objects'),
  }),
} as const

export const addCardCommentOutputSchema = GENERIC_SCHEMAS.hasMessage
  .merge(
    z.object({
      newCommentId: trelloIdSchema.describe('Unique identifier of the newly created comment'),
    })
  )
  .describe('Output schema for adding a comment to a card')

export const createCardOutputSchema = GENERIC_SCHEMAS.hasMessage
  .merge(
    z.object({
      newCardId: cardSchema.shape.id.describe('Unique identifier of the new card'),
    })
  )
  .describe('Output schema for creating a card')

export const getMemberByIdOrUsernameOutputSchema = GENERIC_SCHEMAS.outputsMember.describe(
  'Output schema for getting a member by its ID or username'
)

export const getListsInBoardOutputSchema = GENERIC_SCHEMAS.outputsLists.describe(
  'Output schema for getting all lists in a board'
)

export const getListsByDisplayNameOutputSchema = GENERIC_SCHEMAS.outputsLists.describe(
  'Output schema for getting a list ID from its name'
)

export const getListByIdOutputSchema = GENERIC_SCHEMAS.outputsList.describe(
  'Output schema for getting a list from its ID'
)

export const getCardsInListOutputSchema = GENERIC_SCHEMAS.outputsCards.describe(
  'Output schema for getting all cards in a list'
)

export const getCardsByDisplayNameOutputSchema = GENERIC_SCHEMAS.outputsCards.describe(
  'Output schema for getting a card ID from its name'
)

export const getCardByIdOutputSchema = GENERIC_SCHEMAS.outputsCard.describe(
  'Output schema for getting a card from its ID'
)

export const getBoardsByDisplayNameOutputSchema = GENERIC_SCHEMAS.outputsBoards.describe(
  'Output schema for getting a board from its name'
)

export const getBoardMembersByDisplayNameOutputSchema = GENERIC_SCHEMAS.outputsMembers.describe(
  'Output schema for getting a member from its name'
)

export const getBoardByIdOutputSchema = GENERIC_SCHEMAS.outputsBoard.describe(
  'Output schema for getting a board from its ID'
)

export const getAllBoardsOutputSchema = GENERIC_SCHEMAS.outputsBoards.describe('Output schema for getting all boards')

export const getAllBoardMembersOutputSchema = GENERIC_SCHEMAS.outputsMembers.describe(
  'Output schema for getting all members of a board'
)

export const moveCardDownOutputSchema = GENERIC_SCHEMAS.hasMessage.describe('Output schema for moving a card down')
export const moveCardUpOutputSchema = GENERIC_SCHEMAS.hasMessage.describe('Output schema for moving a card up')
export const moveCardToListOutputSchema = GENERIC_SCHEMAS.hasMessage.describe(
  'Output schema for moving a card to a list'
)
export const updateCardOutputSchema = GENERIC_SCHEMAS.hasMessage.describe('Output schema for updating a card')

export const getAllCardMembersOutputSchema = GENERIC_SCHEMAS.outputsMembers.describe(
  'Output schema for getting all members of a card'
)
