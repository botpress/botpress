import { z } from '@botpress/sdk'
import { TrelloIDSchema, BoardSchema, CardSchema, ListSchema, MemberSchema } from '../entities'

const GENERIC_SHEMAS = {
  hasMessage: z.object({
    message: z.string().describe('Output message'),
  }),
  outputsMember: z.object({
    member: MemberSchema,
  }),
  outputsMembers: z.object({
    members: z.array(MemberSchema),
  }),
  outputsCard: z.object({
    card: CardSchema,
  }),
  outputsCards: z.object({
    cards: z.array(CardSchema),
  }),
  outputsList: z.object({
    list: ListSchema,
  }),
  outputsLists: z.object({
    lists: z.array(ListSchema),
  }),
  outputsBoard: z.object({
    board: BoardSchema,
  }),
  outputsBoards: z.object({
    boards: z.array(BoardSchema),
  }),
} as const

export const addCardCommentOutputSchema = GENERIC_SHEMAS.hasMessage
  .merge(
    z.object({
      newCommentId: TrelloIDSchema.describe('Unique identifier of the newly created comment'),
    })
  )
  .describe('Output schema for adding a comment to a card')

export const createCardOutputSchema = GENERIC_SHEMAS.hasMessage
  .merge(
    z.object({
      newCardId: CardSchema.shape.id.describe('Unique identifier of the new card'),
    })
  )
  .describe('Output schema for creating a card')

export const getMemberByIdOrUsernameOutputSchema = GENERIC_SHEMAS.outputsMember.describe(
  'Output schema for getting a member by its ID or username'
)

export const getListsInBoardOutputSchema = GENERIC_SHEMAS.outputsLists.describe(
  'Output schema for getting all lists in a board'
)

export const getListsByDisplayNameOutputSchema = GENERIC_SHEMAS.outputsLists.describe(
  'Output schema for getting a list ID from its name'
)

export const getListByIdOutputSchema = GENERIC_SHEMAS.outputsList.describe(
  'Output schema for getting a list from its ID'
)

export const getCardsInListOutputSchema = GENERIC_SHEMAS.outputsCards.describe(
  'Output schema for getting all cards in a list'
)

export const getCardsByDisplayNameOutputSchema = GENERIC_SHEMAS.outputsCards.describe(
  'Output schema for getting a card ID from its name'
)

export const getCardByIdOutputSchema = GENERIC_SHEMAS.outputsCard.describe(
  'Output schema for getting a card from its ID'
)

export const getBoardsByDisplayNameOutputSchema = GENERIC_SHEMAS.outputsBoards.describe(
  'Output schema for getting a board from its name'
)

export const getBoardMembersByDisplayNameOutputSchema = GENERIC_SHEMAS.outputsMembers.describe(
  'Output schema for getting a member from its name'
)

export const getBoardByIdOutputSchema = GENERIC_SHEMAS.outputsBoard.describe(
  'Output schema for getting a board from its ID'
)

export const getAllBoardsOutputSchema = GENERIC_SHEMAS.outputsBoards.describe('Output schema for getting all boards')

export const getAllBoardMembersOutputSchema = GENERIC_SHEMAS.outputsMembers.describe(
  'Output schema for getting all members of a board'
)

export const moveCardDownOutputSchema = GENERIC_SHEMAS.hasMessage.describe('Output schema for moving a card down')
export const moveCardUpOutputSchema = GENERIC_SHEMAS.hasMessage.describe('Output schema for moving a card up')
export const moveCardToListOutputSchema = GENERIC_SHEMAS.hasMessage.describe(
  'Output schema for moving a card to a list'
)
export const updateCardOutputSchema = GENERIC_SHEMAS.hasMessage.describe('Output schema for updating a card')

export const getAllCardMembersOutputSchema = GENERIC_SHEMAS.outputsMembers.describe(
  'Output schema for getting all members of a card'
)
