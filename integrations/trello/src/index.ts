import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import * as bp from '../.botpress'
import {
  getBoardsByDisplayName,
  getCardsByDisplayName,
  getListsByDisplayName,
  createCard,
  moveCardUp,
  moveCardDown,
  moveCardToList,
  addCardComment,
  updateCard,
  getAllBoardMembers,
  getAllBoards,
  getBoardById,
  getBoardMembersByDisplayName,
  getCardById,
  getCardsInList,
  getListById,
  getListsInBoard,
  getMemberByIdOrUsername,
  cardList,
  cardRead,
  cardCreate,
  cardUpdate,
  cardDelete,
  listList,
  listRead,
  boardList,
  boardRead,
  cardMemberList,
  cardMemberRead,
  boardMemberList,
  boardMemberRead,
  getAllCardMembers,
} from './actions'
import { channels } from './channels/publisher-dispatcher'
import { handler } from './webhook-events'
import { WebhookLifecycleManager } from './webhook-events/webhook-lifecycle-manager'

const integration = new bp.Integration({
  register: WebhookLifecycleManager.registerTrelloWebhookIfNotExists,
  unregister: WebhookLifecycleManager.unregisterTrelloWebhookIfExists,

  actions: {
    addCardComment,
    createCard,
    getAllBoardMembers,
    getAllBoards,
    getBoardById,
    getBoardMembersByDisplayName,
    getBoardsByDisplayName,
    getCardById,
    getCardsByDisplayName,
    getCardsInList,
    getListById,
    getListsByDisplayName,
    getListsInBoard,
    getMemberByIdOrUsername,
    moveCardDown,
    moveCardToList,
    moveCardUp,
    updateCard,
    getAllCardMembers,

    // interfaces:
    cardList,
    cardRead,
    cardCreate,
    cardUpdate,
    cardDelete,
    listList,
    listRead,
    boardList,
    boardRead,
    cardMemberList,
    cardMemberRead,
    boardMemberList,
    boardMemberRead,
  },

  channels,
  handler,
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
