import { getAllBoards, getBoardsByDisplayName, getBoardById } from './board-actions'
import { boardList, boardRead } from './board-interface-actions'
import {
  getCardsInList,
  getCardsByDisplayName,
  getCardById,
  createCard,
  updateCard,
  moveCardToList,
  moveCardUp,
  moveCardDown,
} from './card-actions'
import { addCardComment } from './card-comment-actions'
import { cardList, cardRead, cardCreate, cardUpdate, cardDelete } from './card-interface-actions'
import { getListsInBoard, getListsByDisplayName, getListById } from './list-actions'
import { listList, listRead } from './list-interface-actions'
import {
  getAllBoardMembers,
  getAllCardMembers,
  getMemberByIdOrUsername,
  getBoardMembersByDisplayName,
} from './member-actions'
import { boardMemberList, boardMemberRead, cardMemberList, cardMemberRead } from './member-interface-actions'
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
  addCardComment,
  moveCardUp,
  moveCardDown,
  moveCardToList,
  // === Member Actions ===
  getMemberByIdOrUsername,
  getBoardMembersByDisplayName,
  getAllBoardMembers,
  getAllCardMembers,
  // === Interface Board Actions ===
  boardList,
  boardRead,
  // === Interface List Actions ===
  listList,
  listRead,
  // === Interface Card Actions ===
  cardList,
  cardRead,
  cardCreate,
  cardUpdate,
  cardDelete,
  // === Interface Member Actions ===
  boardMemberList,
  boardMemberRead,
  cardMemberList,
  cardMemberRead,
} as const satisfies bp.IntegrationProps['actions']
