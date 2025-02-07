import { IntegrationDefinitionProps } from '@botpress/sdk'
import {
  addCardCommentInputSchema,
  addCardCommentOutputSchema,
  createCardInputSchema,
  createCardOutputSchema,
  getAllBoardMembersInputSchema,
  getAllBoardMembersOutputSchema,
  getAllBoardsInputSchema,
  getAllBoardsOutputSchema,
  getBoardByIdInputSchema,
  getBoardByIdOutputSchema,
  getBoardMembersByDisplayNameInputSchema,
  getBoardMembersByDisplayNameOutputSchema,
  getBoardsByDisplayNameInputSchema,
  getBoardsByDisplayNameOutputSchema,
  getCardByIdInputSchema,
  getCardByIdOutputSchema,
  getCardsByDisplayNameInputSchema,
  getCardsByDisplayNameOutputSchema,
  getCardsInListInputSchema,
  getCardsInListOutputSchema,
  getListByIdInputSchema,
  getListByIdOutputSchema,
  getListsByDisplayNameInputSchema,
  getListsByDisplayNameOutputSchema,
  getListsInBoardInputSchema,
  getListsInBoardOutputSchema,
  getMemberByIdOrUsernameInputSchema,
  getMemberByIdOrUsernameOutputSchema,
  moveCardDownInputSchema,
  moveCardDownOutputSchema,
  moveCardToListInputSchema,
  moveCardToListOutputSchema,
  moveCardUpInputSchema,
  moveCardUpOutputSchema,
  updateCardInputSchema,
  updateCardOutputSchema,
  getAllCardMembersInputSchema,
  getAllCardMembersOutputSchema,
} from './schemas'

export const actions = {
  getBoardsByDisplayName: {
    title: 'Get boards by name',
    description: 'Find all boards whose display name match this name',
    input: {
      schema: getBoardsByDisplayNameInputSchema,
    },
    output: {
      schema: getBoardsByDisplayNameOutputSchema,
    },
  },
  getListsByDisplayName: {
    title: 'Get lists by name',
    description: 'Find all lists whose display name match this name',
    input: {
      schema: getListsByDisplayNameInputSchema,
    },
    output: {
      schema: getListsByDisplayNameOutputSchema,
    },
  },
  getListById: {
    title: 'Get list by ID',
    description: 'Get a list by its unique identifier',
    input: {
      schema: getListByIdInputSchema,
    },
    output: {
      schema: getListByIdOutputSchema,
    },
  },
  getCardsByDisplayName: {
    title: 'Find cards by name name',
    description: 'Find all lists whose display name match this name',
    input: {
      schema: getCardsByDisplayNameInputSchema,
    },
    output: {
      schema: getCardsByDisplayNameOutputSchema,
    },
  },
  createCard: {
    title: 'Create new card',
    description: 'Create a card and add it to a list',
    input: {
      schema: createCardInputSchema,
    },
    output: {
      schema: createCardOutputSchema,
    },
  },
  moveCardUp: {
    title: 'Move card up',
    description: 'Move a card n spaces up',
    input: {
      schema: moveCardUpInputSchema,
    },
    output: {
      schema: moveCardUpOutputSchema,
    },
  },
  moveCardDown: {
    title: 'Move card down',
    description: 'Move a card n spaces down',
    input: {
      schema: moveCardDownInputSchema,
    },
    output: {
      schema: moveCardDownOutputSchema,
    },
  },
  moveCardToList: {
    title: 'Move card to another list',
    description: 'Move a card to another list within the same board',
    input: {
      schema: moveCardToListInputSchema,
    },
    output: {
      schema: moveCardToListOutputSchema,
    },
  },
  addCardComment: {
    title: 'Add card comment',
    description: 'Add a new comment to a card',
    input: {
      schema: addCardCommentInputSchema,
    },
    output: {
      schema: addCardCommentOutputSchema,
    },
  },
  updateCard: {
    title: 'Update card',
    description: 'Update the details of a card',
    input: {
      schema: updateCardInputSchema,
    },
    output: {
      schema: updateCardOutputSchema,
    },
  },
  getBoardMembersByDisplayName: {
    title: 'Get members by name',
    description: 'Find all members whose display name match this name',
    input: {
      schema: getBoardMembersByDisplayNameInputSchema,
    },
    output: {
      schema: getBoardMembersByDisplayNameOutputSchema,
    },
  },
  getAllBoardMembers: {
    title: 'Get all board members',
    description: 'Get all members of a board',
    input: {
      schema: getAllBoardMembersInputSchema,
    },
    output: {
      schema: getAllBoardMembersOutputSchema,
    },
  },
  getAllBoards: {
    title: 'Get all boards',
    description: 'Get all boards managed by the authenticated user',
    input: {
      schema: getAllBoardsInputSchema,
    },
    output: {
      schema: getAllBoardsOutputSchema,
    },
  },
  getBoardById: {
    title: 'Get board by ID',
    description: 'Get a board by its unique identifier',
    input: {
      schema: getBoardByIdInputSchema,
    },
    output: {
      schema: getBoardByIdOutputSchema,
    },
  },
  getListsInBoard: {
    title: 'Get lists in board',
    description: 'Get all lists in a board',
    input: {
      schema: getListsInBoardInputSchema,
    },
    output: {
      schema: getListsInBoardOutputSchema,
    },
  },
  getCardsInList: {
    title: 'Get cards in list',
    description: 'Get all cards in a list',
    input: {
      schema: getCardsInListInputSchema,
    },
    output: {
      schema: getCardsInListOutputSchema,
    },
  },
  getCardById: {
    title: 'Get card by ID',
    description: 'Get a card by its unique identifier',
    input: {
      schema: getCardByIdInputSchema,
    },
    output: {
      schema: getCardByIdOutputSchema,
    },
  },
  getMemberByIdOrUsername: {
    title: 'Get member by ID or username',
    description: 'Get a member by their unique identifier or username',
    input: {
      schema: getMemberByIdOrUsernameInputSchema,
    },
    output: {
      schema: getMemberByIdOrUsernameOutputSchema,
    },
  },
  getAllCardMembers: {
    title: 'Get all card members',
    description: 'Get all members of a card',
    input: {
      schema: getAllCardMembersInputSchema,
    },
    output: {
      schema: getAllCardMembersOutputSchema,
    },
  },
} as const satisfies NonNullable<IntegrationDefinitionProps['actions']>
