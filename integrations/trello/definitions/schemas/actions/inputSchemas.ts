import { z } from '@botpress/sdk'
import { BoardSchema, CardSchema, ListSchema, MemberSchema, TrelloIDSchema } from '../entities'

const GENERIC_SHEMAS = {
  noInput: z.object({}),
  hasBoardId: z.object({ boardId: BoardSchema.shape.id.describe('Unique identifier of the board') }),
  hasListId: z.object({ listId: ListSchema.shape.id.describe('Unique identifier of the list') }),
  hasCardId: z.object({ cardId: CardSchema.shape.id.describe('Unique identifier of the card') }),
} as const

export const addCardCommentInputSchema = z
  .object({
    cardId: CardSchema.shape.id.describe('Unique identifier of the card to which a comment will be added'),
    commentBody: z.string().describe('The body text of the comment'),
  })
  .describe('Input schema for adding a comment to a card')

export const createCardInputSchema = z
  .object({
    listId: ListSchema.shape.id.describe('ID of the list in which to insert the new card'),
    cardName: CardSchema.shape.name.describe('Name of the new card'),
    cardBody: CardSchema.shape.description.optional().describe('Body text of the new card'),
    members: z
      .array(TrelloIDSchema)
      .optional()
      .describe('Members to add to the card (Optional). This should be a list of member IDs.'),
    labels: z
      .array(TrelloIDSchema)
      .optional()
      .describe('Labels to add to the card (Optional). This should be a list of label IDs.'),
    dueDate: CardSchema.shape.dueDate.optional().describe('The due date of the card in ISO 8601 format (Optional).'),
  })
  .describe('Input schema for creating a new card')

export const updateCardInputSchema = GENERIC_SHEMAS.hasCardId
  .merge(
    z.object({
      name: CardSchema.shape.name
        .optional()
        .describe('The name of the card (Optional) (e.g. "My Test Card"). Leave empty to keep the current name.'),
      bodyText: CardSchema.shape.description
        .optional()
        .describe('Body text of the new card (Optional). Leave empty to keep the current body.'),
      closedState: z
        .enum(['open', 'archived'])
        .optional()
        .describe(
          'Whether the card should be archived (Optional). Enter "open", "archived" (without quotes), or leave empty to keep the previous status.'
        )
        .optional(),
      completeState: z
        .enum(['complete', 'incomplete'])
        .optional()
        .describe(
          'Whether the card should be marked as complete (Optional). Enter "complete", "incomplete" (without quotes), or leave empty to keep the previous status.'
        )
        .optional(),
      membersToAdd: z
        .array(TrelloIDSchema)
        .optional()
        .describe(
          'Members to add to the card (Optional). This should be a list of member IDs. Leave empty to keep the current members.'
        ),
      membersToRemove: z
        .array(TrelloIDSchema)
        .optional()
        .describe(
          'Members to remove from the card (Optional). This should be a list of member IDs. Leave empty to keep the current members.'
        ),
      labelsToAdd: z
        .array(TrelloIDSchema)
        .optional()
        .describe(
          'Labels to add to the card (Optional). This should be a list of label IDs. Leave empty to keep the current labels.'
        ),
      labelsToRemove: z
        .array(TrelloIDSchema)
        .optional()
        .describe(
          'Labels to remove from the card (Optional). This should be a list of label IDs. Leave empty to keep the current labels.'
        ),
      dueDate: CardSchema.shape.dueDate
        .optional()
        .describe('The due date of the card in ISO 8601 format (Optional). Leave empty to keep the current due date.'),
    })
  )
  .describe('Input schema for creating a new card')

export const moveCardUpInputSchema = GENERIC_SHEMAS.hasCardId.merge(
  z.object({
    moveUpByNSpaces: z.number().min(1).optional().default(1).describe('Number of spaces by which to move the card up'),
  })
)

export const moveCardDownInputSchema = GENERIC_SHEMAS.hasCardId.merge(
  z.object({
    moveDownByNSpaces: moveCardUpInputSchema.shape.moveUpByNSpaces.describe(
      'Number of spaces by which to move the card down'
    ),
  })
)

export const moveCardToListInputSchema = GENERIC_SHEMAS.hasCardId.merge(
  z.object({
    newListId: ListSchema.shape.id.describe('Unique identifier of the list in which the card will be moved'),
  })
)

export const getMemberByIdOrUsernameInputSchema = z
  .object({
    memberIdOrUsername: z
      .union([MemberSchema.shape.id, MemberSchema.shape.username])
      .describe('ID or username of the member to get'),
  })
  .describe('Input schema for getting a member from its ID or username')

export const getListsInBoardInputSchema = GENERIC_SHEMAS.hasBoardId.describe(
  'Input schema for getting all lists in a board'
)

export const getListsByDisplayNameInputSchema = GENERIC_SHEMAS.hasBoardId
  .merge(
    z.object({
      listName: ListSchema.shape.name.describe('Display name of the list'),
    })
  )
  .describe('Input schema for getting a list ID from its name')

export const getListByIdInputSchema = GENERIC_SHEMAS.hasListId.describe('Input schema for getting a list from its ID')

export const getCardsInListInputSchema = GENERIC_SHEMAS.hasListId.describe(
  'Input schema for getting all cards in a list'
)

export const getCardsByDisplayNameInputSchema = GENERIC_SHEMAS.hasListId
  .merge(
    z.object({
      cardName: CardSchema.shape.name.describe('Display name of the card'),
    })
  )
  .describe('Input schema for getting a card ID from its name')

export const getCardByIdInputSchema = GENERIC_SHEMAS.hasCardId.describe('Input schema for getting a card from its ID')

export const getBoardsByDisplayNameInputSchema = z
  .object({
    boardName: BoardSchema.shape.name.describe('Display name of the board'),
  })
  .describe('Input schema for getting a board ID from its name')

export const getBoardMembersByDisplayNameInputSchema = GENERIC_SHEMAS.hasBoardId
  .merge(
    z.object({
      displayName: BoardSchema.shape.name.describe('Display name of the member'),
    })
  )
  .describe('Input schema for getting a member from its name')
export const getBoardByIdInputSchema = GENERIC_SHEMAS.hasBoardId.describe(
  'Input schema for getting a board from its ID'
)

export const getAllBoardsInputSchema = GENERIC_SHEMAS.noInput.describe('Input schema for getting all boards')

export const getAllBoardMembersInputSchema = GENERIC_SHEMAS.hasBoardId.describe(
  'Input schema for getting all members of a board'
)

export const getAllCardMembersInputSchema = GENERIC_SHEMAS.hasCardId.describe(
  'Input schema for getting all members of a card'
)
