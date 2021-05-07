import * as sdk from 'botpress/sdk'
import { CustomRouter } from 'core/routers/customRouter'
import { AuthService, checkApiKey, checkTokenHeader, TOKEN_AUDIENCE } from 'core/security'
import { RequestHandler, Router } from 'express'
import { ConversationService, MessageService } from '.'

export class MessagingRouter extends CustomRouter {
  private checkTokenHeader!: RequestHandler
  private checkApiKey!: RequestHandler

  constructor(
    private logger: sdk.Logger,
    private authService: AuthService,
    private conversations: ConversationService,
    private messages: MessageService
  ) {
    super('Messaging', logger, Router({ mergeParams: true }))
    this.checkApiKey = checkApiKey(this.authService)
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.setupRoutes()
  }

  private setupRoutes() {
    this.router.post(
      '/conversations',
      this.checkApiKey,
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { userId } = req.body
        const conversation = await this.conversations.forBot(botId).create(userId)
        res.send(conversation)
      })
    )

    this.router.delete(
      '/conversations',
      this.checkApiKey,
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { id, userId } = req.query

        const deleted = await this.conversations.forBot(botId).delete({ id, userId })
        res.send({ count: deleted })
      })
    )

    this.router.get(
      '/conversations/:conversationId',
      this.checkApiKey,
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { conversationId } = req.params

        const conversation = await this.conversations.forBot(botId).get(conversationId)

        if (conversation) {
          res.send(conversation)
        } else {
          res.sendStatus(404)
        }
      })
    )

    this.router.get(
      '/conversations/',
      this.checkApiKey,
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { userId, limit } = req.query

        const conversations = await this.conversations.forBot(botId).list({ userId, limit })
        res.send(conversations)
      })
    )

    this.router.get(
      '/conversations/:userId/recent',
      this.checkApiKey,
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { botId, userId } = req.params

        const conversation = await this.conversations.forBot(botId).recent(userId)
        res.send(conversation)
      })
    )

    this.router.post(
      '/messages',
      this.checkApiKey,
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { conversationId, payload, from, eventId, incomingEventId } = req.body

        const message = await this.messages
          .forBot(botId)
          .create(conversationId, payload, from, eventId, incomingEventId)
        res.send(message)
      })
    )

    this.router.delete(
      '/messages',
      this.checkApiKey,
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { id, conversationId } = req.query

        const deleted = await this.messages.forBot(botId).delete({ id, conversationId })
        res.send({ count: deleted })
      })
    )

    this.router.get(
      '/messages/:messageId',
      this.checkApiKey,
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { messageId } = req.params

        const message = await this.messages.forBot(botId).get(messageId)

        if (message) {
          res.send(message)
        } else {
          res.sendStatus(404)
        }
      })
    )

    this.router.get(
      '/messages/',
      this.checkApiKey,
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { conversationId, limit } = req.query

        const conversations = await this.messages.forBot(botId).list({ conversationId, limit })
        res.send(conversations)
      })
    )

    this.router.post(
      '/messages/:conversationId/send',
      this.checkApiKey,
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { botId, conversationId } = req.params
        const { payload, args } = req.body

        const message = await this.messages.forBot(botId).send(conversationId, payload, args)
        res.send(message)
      })
    )

    this.router.post(
      '/messages/:conversationId/receive',
      this.checkApiKey,
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { botId, conversationId } = req.params
        const { payload, args } = req.body

        const message = await this.messages.forBot(botId).receive(conversationId, payload, args)
        res.send(message)
      })
    )
  }
}
