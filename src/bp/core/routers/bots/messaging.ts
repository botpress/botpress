import * as sdk from 'botpress/sdk'
import bpfs from 'bpfs'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { MessagingAPI } from 'core/services/messaging/messaging'
import { RequestHandler, Router } from 'express'

import { CustomRouter } from '../customRouter'
import { checkTokenHeader } from '../util'

export class MessagingRouter extends CustomRouter {
  private checkTokenHeader: RequestHandler

  constructor(private logger: sdk.Logger, private authService: AuthService, private messagingApi: MessagingAPI) {
    super('Messaging', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.setupRoutes()
  }

  private setupRoutes() {
    // TODO check for api secret key

    this.router.post(
      '/conversations',
      this.asyncMiddleware(async (req, res) => {
        const conversation = await this.messagingApi.createConversation(req.body)
        res.send(conversation)
      })
    )

    this.router.delete(
      '/conversations',
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { id, userId } = req.query

        if (id) {
          const deleted = await this.messagingApi.deleteConversation(+id)
          res.send({ count: deleted ? 1 : 0 })
        } else {
          const deleted = await this.messagingApi.deleteAllConversations({ botId, userId })
          res.send({ count: deleted })
        }
      })
    )

    this.router.get(
      '/conversations/:conversationId',
      this.asyncMiddleware(async (req, res) => {
        const { conversationId } = req.params

        const conversation = await this.messagingApi.getConversationById(+conversationId)

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

        const conversations = await this.messagingApi.getRecentConversations({ botId, userId }, limit)
        res.send(conversations)
      })
    )

    this.router.get(
      '/conversations/:userId/recent',
      this.asyncMiddleware(async (req, res) => {
        const { botId, userId } = req.params

        const conversation = await this.messagingApi.getOrCreateRecentConversation({ botId, userId })
        res.send(conversation)
      })
    )

    this.router.post(
      '/messages',
      this.asyncMiddleware(async (req, res) => {
        const { conversationId, eventId, incomingEventId, from, payload } = req.body
        const message = await this.messagingApi.createMessage(+conversationId, eventId, incomingEventId, from, payload)
        res.send(message)
      })
    )

    this.router.delete(
      '/messages',
      this.asyncMiddleware(async (req, res) => {
        const { id, conversationId } = req.query

        if (id) {
          const deleted = await this.messagingApi.deleteMessage(+id)
          res.send({ count: deleted ? 1 : 0 })
        } else {
          const deleted = await this.messagingApi.deleteAllMessages(+conversationId)
          res.send({ count: deleted })
        }
      })
    )

    this.router.get(
      '/messages/:messageId',
      this.asyncMiddleware(async (req, res) => {
        const { messageId } = req.params

        const message = await this.messagingApi.getMessageById(+messageId)

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
        const { conversationId, limit } = req.query

        const conversations = await this.messagingApi.getRecentMessages(conversationId, limit)
        res.send(conversations)
      })
    )

    this.router.post(
      '/messages/:conversationId/send',
      this.asyncMiddleware(async (req, res) => {
        const { conversationId } = req.params
        const { payload, args } = req.body

        const message = await this.messagingApi.sendOutgoing(conversationId, payload, args)
        res.send(message)
      })
    )

    this.router.post(
      '/messages/:conversationId/receive',
      this.asyncMiddleware(async (req, res) => {
        const { conversationId } = req.params
        const { payload, args } = req.body

        const message = await this.messagingApi.sendIncoming(conversationId, payload, args)
        res.send(message)
      })
    )
  }
}
