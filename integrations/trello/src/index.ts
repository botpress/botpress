import { z } from '@botpress/sdk'
import events from 'definitions/events'
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
import { ICardCommentCreationService } from './interfaces/services/ICardCommentCreationService'
import { DIToken, getContainer } from './iocContainer'
import commentCardEventSchema from './schemas/webhookEvents/commentCardEventSchema'
import { genericWebhookEvent, genericWebhookEventSchema } from './schemas/webhookEvents/genericWebhookEventSchema'
import { WebhookManager } from './webhookManager'

type TrelloMessageData = {
  cardId: string
  cardName: string
  listId: string
  listName: string
  messageId: string
  messageText: string
  messageAuthorId: string
  messageAuthorName: string
  messageAuthorAvatar: string
}

const handleCardComment = async (client: bp.Client, logger: bp.Logger, messageData: TrelloMessageData) => {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'cardComments',
    tags: {
      cardId: messageData.cardId,
      cardName: messageData.cardName,
      listId: messageData.listId,
      listName: messageData.listName,
    },
  })

  if (conversation.tags.lastCommentId === messageData.messageId) {
    logger.forBot().info('Ignoring message as it was sent by ourselves')
    return
  }

  const { user } = await client.getOrCreateUser({
    tags: {
      userId: messageData.messageAuthorId,
    },
    name: messageData.messageAuthorName,
    pictureUrl: messageData.messageAuthorAvatar,
  })

  await client.createMessage({
    tags: {
      commentId: messageData.messageId,
    },
    type: 'text',
    userId: user.id,
    conversationId: conversation.id,
    payload: { text: messageData.messageText },
  })
}

const handleIncomingEvent = async ({
  event,
  client,
  logger,
}: {
  event: genericWebhookEvent
  client: bp.Client
  logger: bp.Logger
}) => {
  if (event.action.type === 'commentCard') {
    const cardCreationEvent = commentCardEventSchema.parse(event)

    await handleCardComment(client, logger, {
      cardId: cardCreationEvent.action.data.card.id,
      cardName: cardCreationEvent.action.data.card.name,
      listId: cardCreationEvent.action.data.list?.id ?? '',
      listName: cardCreationEvent.action.data.list?.name ?? '',
      messageId: cardCreationEvent.action.id,
      messageText: cardCreationEvent.action.data.text,
      messageAuthorId: cardCreationEvent.action.memberCreator.id,
      messageAuthorName: cardCreationEvent.action.memberCreator.fullName,
      messageAuthorAvatar: cardCreationEvent.action.memberCreator.avatarUrl + '/50.png',
    })
  }

  if (Reflect.ownKeys(bp.events).includes(event.action.type)) {
    const eventSchema = genericWebhookEventSchema.merge(
      z.object({
        action: genericWebhookEventSchema.shape.action.merge(
          z.object({
            data: events[event.action.type].schema,
          })
        ),
      })
    )
    const validatedData = eventSchema.passthrough().parse(event).action.data

    await client.createEvent({ type: event.action.type, payload: validatedData })
  } else {
    logger.forBot().debug('Ignoring unsupported event type', event.action.type)
  }
}

export default new bp.Integration({
  async register({ ctx, webhookUrl, client, logger }) {
    const container = getContainer(ctx)
    const integration = new WebhookManager(ctx, client, container, logger)

    await integration.registerTrelloWebhookIfNotExists(webhookUrl)
  },

  async unregister({ ctx, client, logger }) {
    const container = getContainer(ctx)
    const integration = new WebhookManager(ctx, client, container, logger)

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
        text: async ({ ctx, conversation, ack, payload, client }) => {
          const container = getContainer(ctx)
          const cardCommentCreationService = container.resolve<ICardCommentCreationService>(
            DIToken.CardCommentCreationService
          )

          const commentId = await cardCommentCreationService.createComment(conversation.tags.cardId!, payload.text)

          await client.updateConversation({
            id: conversation.id,
            tags: {
              lastCommentId: commentId,
            },
          })

          await ack({ tags: { commentId } })
        },
      },
    },
  },
  async handler({ req, client, ctx, logger }) {
    if (!req.body) {
      logger.forBot().debug('Webhook request ignored: no body')
      return
    }

    const { state } = await client.getState({
      type: 'integration',
      name: 'webhookState',
      id: ctx.integrationId,
    })

    const body = JSON.parse(req.body)
    const { success, error, data } = genericWebhookEventSchema.passthrough().safeParse(body)

    if (!success) {
      logger.forBot().warn('Webhook request ignored: invalid body', error)
      return
    }

    if (data.webhook.id !== state.payload.trelloWebhookId) {
      logger.forBot().warn('Webhook request ignored: not properly authenticated')
      return
    }

    await handleIncomingEvent({ event: data as genericWebhookEvent, client, logger })
  },
})
