import * as sdk from 'botpress/sdk'
import { EventRepository } from 'core/events'
import { CustomRouter } from 'core/routers/customRouter'
import { AuthService, checkTokenHeader, TOKEN_AUDIENCE } from 'core/security'
import { RequestHandler, Router } from 'express'

export class MessagingBotRouter extends CustomRouter {
  protected readonly checkTokenHeader: RequestHandler

  constructor(logger: sdk.Logger, private auth: AuthService, private eventRepo: EventRepository) {
    super('Messaging', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(auth, TOKEN_AUDIENCE)
    this.setupRoutes()
  }

  public setupRoutes(): void {
    this.router.get(
      '/message-to-event/:messageId',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const [messageEvent] = await this.eventRepo.findEvents({
          messageId: req.params.messageId,
          botId: req.params.botId
        })

        if (!messageEvent) {
          return res.sendStatus(404)
        }

        const [incomingEvent] = await this.eventRepo.findEvents({
          incomingEventId: messageEvent.incomingEventId,
          direction: 'incoming',
          botId: req.params.botId
        })

        if (!incomingEvent) {
          return res.sendStatus(404)
        }

        return res.send(incomingEvent.event)
      })
    )

    this.router.get(
      '/list-by-incoming-event/:messageId',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { messageId, botId } = req.params

        const [messageEvent] = (await this.loadEvents({ messageId, botId })) || []

        if (!messageEvent) {
          return res.sendStatus(404)
        }

        const messages = await this.loadEvents({
          incomingEventId: messageEvent.incomingEventId,
          botId
        })

        if (!messages) {
          return res.sendStatus(404)
        }

        const messageIds = messages.map(m => m.messageId)

        return res.send(messageIds)
      })
    )
  }

  private loadEvents = async (fields: Partial<sdk.IO.StoredEvent>, retryCount: number = 0) => {
    const DELAY_BETWEEN_CALLS = 500
    const allowedRetryCount = 6

    const events = await this.eventRepo.findEvents(fields)
    if (events?.length) {
      return events
    } else if (retryCount < allowedRetryCount) {
      await Promise.delay(DELAY_BETWEEN_CALLS)
      return this.loadEvents(fields, ++retryCount)
    } else {
      return []
    }
  }
}
