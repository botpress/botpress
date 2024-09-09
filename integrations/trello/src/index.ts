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
  listList,
  listRead,
  boardList,
  boardRead,
  boardmemberList,
  boardmemberRead,
  getCardMembers,
  cardmemberList,
  cardmemberRead,
  cardCreate,
  cardUpdate,
  cardDelete,
} from './actions'
import { textMessagePublish } from './channels/cardComments/text'
import { WebhookEventConsumer } from './webhookEventConsumer'
import { WebhookLifecycleManager } from './webhookLifecycleManager'

const integration = new bp.Integration({
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
    getCardMembers,
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

    // interface actions:
    cardList,
    cardRead,
    cardCreate,
    cardUpdate,
    cardDelete,
    listList,
    listRead,
    boardList,
    boardRead,
    boardmemberList,
    boardmemberRead,
    cardmemberList,
    cardmemberRead,
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

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
