import * as sdk from 'botpress/sdk'
import bpfs from 'bpfs'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { ConversationService } from 'core/services/messaging/conversations'
import { MessageService } from 'core/services/messaging/messages'
import { RequestHandler, Router } from 'express'

import { CustomRouter } from '../customRouter'
import { checkTokenHeader } from '../util'

export class MessagingRouter extends CustomRouter {
  private checkTokenHeader: RequestHandler

  constructor(
    private logger: sdk.Logger,
    private authService: AuthService,
    private conversations: ConversationService,
    private messages: MessageService
  ) {
    super('Messaging', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.setupRoutes()
  }

  private setupRoutes() {
    // TODO check for api secret key

    this.router.post(
      '/conversations',
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const conversation = await this.conversations.forBot(botId).create(req.body)
        res.send(conversation)
      })
    )

    this.router.delete(
      '/conversations',
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { id, userId } = req.query

        const deleted = await this.conversations.forBot(botId).delete({ id, userId })
        res.send({ count: deleted })
      })
    )

    this.router.get(
      '/conversations/:conversationId',
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

    // TODO allow getting ALL conversations as well
    this.router.get(
      '/conversations/',
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { userId, limit } = req.query

        const conversations = await this.conversations.forBot(botId).list({ userId, limit })
        res.send(conversations)
      })
    )

    this.router.get(
      '/conversations/:userId/recent',
      this.asyncMiddleware(async (req, res) => {
        const { botId, userId } = req.params

        const conversation = await this.conversations.forBot(botId).recent(userId)
        res.send(conversation)
      })
    )

    this.router.post(
      '/messages',
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
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { id, conversationId } = req.query

        const deleted = await this.messages.forBot(botId).delete({ id, conversationId })
        res.send({ count: deleted })
      })
    )

    this.router.get(
      '/messages/:messageId',
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

    // TODO allow getting ALL messages as well
    this.router.get(
      '/messages/',
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { conversationId, limit } = req.query

        const conversations = await this.messages.forBot(botId).list({ conversationId, limit })
        res.send(conversations)
      })
    )

    this.router.post(
      '/messages/:conversationId/send',
      this.asyncMiddleware(async (req, res) => {
        const { botId, conversationId } = req.params
        const { payload, args } = req.body

        const message = await this.messages.forBot(botId).send(conversationId, payload, args)
        res.send(message)
      })
    )

    this.router.post(
      '/messages/:conversationId/receive',
      this.asyncMiddleware(async (req, res) => {
        const { botId, conversationId } = req.params
        const { payload, args } = req.body

        const message = await this.messages.forBot(botId).receive(conversationId, payload, args)
        res.send(message)
      })
    )
  }
}
