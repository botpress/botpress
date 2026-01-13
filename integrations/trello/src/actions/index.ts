import { getAllBoards, getBoardsByDisplayName, getBoardById } from './board-actions'
import {
  getCardsInList,
  getCardsByDisplayName,
  getCardById,
  createCard,
  updateCard,
  moveCardToList,
  moveCardUp,
  moveCardDown,
  deleteCard,
} from './card-actions'
import { addCardComment } from './card-comment-actions'
import { getListsInBoard, getListsByDisplayName, getListById } from './list-actions'
import {
  getAllBoardMembers,
  getAllCardMembers,
  getMemberByIdOrUsername,
  getBoardMembersByDisplayName,
} from './member-actions'
import * as bp from '.botpress'

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
  deleteCard,
  addCardComment,
  moveCardUp,
  moveCardDown,
  moveCardToList,
  // === Member Actions ===
  getMemberByIdOrUsername,
  getBoardMembersByDisplayName,
  getAllBoardMembers,
  getAllCardMembers,
} as const satisfies bp.IntegrationProps['actions']
