import { type IntegrationDefinitionProps } from '@botpress/sdk'
import { getAllBoards, getBoardById, getBoardsByDisplayName } from './board-actions'
import {
  addCardComment,
  createCard,
  getCardById,
  getCardsByDisplayName,
  getCardsInList,
  moveCardDown,
  moveCardToList,
  moveCardUp,
  updateCard,
} from './card-actions'
import { getListById, getListsByDisplayName, getListsInBoard } from './list-actions'
import {
  getAllBoardMembers,
  getAllCardMembers,
  getBoardMembersByDisplayName,
  getMemberByIdOrUsername,
} from './member-actions'

export const actions = {
  // === Board Actions ===
  getBoardById,
  getBoardsByDisplayName,
  getAllBoards,
  // === List Actions ===
  getListById,
  getListsByDisplayName,
  getListsInBoard,
  // === Card Actions ===
  getCardById,
  getCardsByDisplayName,
  getCardsInList,
  createCard,
  updateCard,
  addCardComment,
  moveCardUp,
  moveCardDown,
  moveCardToList,
  // === Member Actions ===
  getMemberByIdOrUsername,
  getBoardMembersByDisplayName,
  getAllBoardMembers,
  getAllCardMembers,
} as const satisfies NonNullable<IntegrationDefinitionProps['actions']>
