import { addCardComment } from './implementations/addCardComment'
import { createCard } from './implementations/createCard'
import { getAllBoardMembers } from './implementations/getAllBoardMembers'
import { getAllBoards } from './implementations/getAllBoards'
import { getAllCardMembers } from './implementations/getAllCardMembers'
import { getBoardById } from './implementations/getBoardById'
import { getBoardMembersByDisplayName } from './implementations/getBoardMembersByDisplayName'
import { getBoardsByDisplayName } from './implementations/getBoardsByDisplayName'
import { getCardById } from './implementations/getCardById'
import { getCardsByDisplayName } from './implementations/getCardsByDisplayName'
import { getCardsInList } from './implementations/getCardsInList'
import { getListById } from './implementations/getListById'
import { getListsByDisplayName } from './implementations/getListsByDisplayName'
import { getListsInBoard } from './implementations/getListsInBoard'
import { getMemberByIdOrUsername } from './implementations/getMemberByIdOrUsername'
import { boardList } from './implementations/interfaces/boardList'
import { boardMemberList } from './implementations/interfaces/boardMemberList'
import { boardMemberRead } from './implementations/interfaces/boardMemberRead'
import { boardRead } from './implementations/interfaces/boardRead'
import { cardCreate } from './implementations/interfaces/cardCreate'
import { cardDelete } from './implementations/interfaces/cardDelete'
import { cardList } from './implementations/interfaces/cardList'
import { cardMemberList } from './implementations/interfaces/cardMemberList'
import { cardMemberRead } from './implementations/interfaces/cardMemberRead'
import { cardRead } from './implementations/interfaces/cardRead'
import { cardUpdate } from './implementations/interfaces/cardUpdate'
import { listList } from './implementations/interfaces/listList'
import { listRead } from './implementations/interfaces/listRead'
import { moveCardDown } from './implementations/moveCardDown'
import { moveCardToList } from './implementations/moveCardToList'
import { moveCardUp } from './implementations/moveCardUp'
import { updateCard } from './implementations/updateCard'
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
  // -----------------------
  //    Interface Actions
  // -----------------------
  boardList,
  boardRead,
  boardMemberList,
  boardMemberRead,
  listList,
  listRead,
  cardList,
  cardRead,
  cardCreate,
  cardUpdate,
  cardDelete,
  cardMemberList,
  cardMemberRead,
} as const satisfies bp.IntegrationProps['actions']
