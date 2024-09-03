import * as bp from '../.botpress'
import {
  getBoardId,
  getCardId,
  getListId,
  createCard,
  moveCardUp,
  moveCardDown,
  moveCardToList,
  addCardComment,
} from './actions'
import { ICardCommentCreationService } from './interfaces/services/ICardCommentCreationService'
import { DIToken, getContainer } from './iocContainer'
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
  logger.forBot().info('Handling action', messageData)

  const { conversation } = await client.getOrCreateConversation({
    channel: 'cardComments',
    tags: {
      cardId: messageData.cardId,
      cardName: messageData.cardName,
      listId: messageData.listId,
      listName: messageData.listName,
    },
  })

  logger.forBot().info('Conversation', conversation)

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
    getBoardId,
    getListId,
    getCardId,
    createCard,
    moveCardUp,
    moveCardDown,
    moveCardToList,
    addCardComment,
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

    if (body?.webhook?.id !== state.payload.trelloWebhookId) {
      return logger.forBot().warn('Webhook request ignored: not properly authenticated')
    }

    if (body?.action?.type !== 'commentCard') {
      return logger.forBot().debug(`Unhandled webhook action type: ${body?.action?.type}`)
    }

    const cardId: string = body!.action.data.card.id
    const cardName: string = body!.action.data.card.name
    const listId: string = body!.action.data.list.id
    const listName: string = body!.action.data.list.name
    const messageId: string = body!.action.id
    const messageText: string = body!.action.data.text
    const messageAuthorId: string = body!.action.memberCreator.id
    const messageAuthorName: string = body!.action.memberCreator.fullName
    const messageAuthorAvatar: string = body!.action.memberCreator.avatarUrl + '/50.png'
    const messageData = {
      cardId,
      cardName,
      listId,
      listName,
      messageId,
      messageText,
      messageAuthorId,
      messageAuthorName,
      messageAuthorAvatar,
    }

    await handleCardComment(client, logger, messageData)
  },
})
