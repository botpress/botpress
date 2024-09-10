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
} from './actions'
import { textMessagePublish } from './channels/cardComments/text'
import { WebhookEventConsumer } from './webhookEventConsumer'
import { WebhookLifecycleManager } from './webhookLifecycleManager'

export default new bp.Integration({
  async register({ ctx, webhookUrl, client, logger }) {
    const integration = new WebhookLifecycleManager(ctx, client, logger)

    await integration.registerTrelloWebhookIfNotExists(webhookUrl)
  },

  async unregister({ ctx, client, logger }) {
    const integration = new WebhookLifecycleManager(ctx, client, logger)

    await integration.unregisterTrelloWebhookIfExists()
  },

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
  },

  channels: {
    cardComments: {
      messages: {
        text: textMessagePublish,
      },
    },
  },

  async handler(handlerProps) {
    const consumer = new WebhookEventConsumer(handlerProps)
    await consumer.consumeWebhookEvent()
  },
})
