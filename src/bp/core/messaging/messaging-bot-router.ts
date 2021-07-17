import * as sdk from 'botpress/sdk'
import { EventRepository } from 'core/events'
import { CustomRouter } from 'core/routers/customRouter'
import { Router } from 'express'

export class MessagingBotRouter extends CustomRouter {
  constructor(logger: sdk.Logger, private eventRepo: EventRepository) {
    super('Messaging', logger, Router({ mergeParams: true }))
    this.setupRoutes()
  }

  public setupRoutes(): void {
    this.router.get(
      '/message-to-event/:messageId',
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

  private loadEvents = async (fields: Partial<sdk.IO.StoredEvent>) => {
    const DELAY_BETWEEN_CALLS = 500
    const allowedRetryCount = 6
    let currentRetryCount = 0
    let keepRetrying = false

    try {
      return this.eventRepo.findEvents(fields)
    } catch (err) {
      keepRetrying = true
    }

    if (keepRetrying) {
      if (currentRetryCount < allowedRetryCount) {
        currentRetryCount++

        await Promise.delay(DELAY_BETWEEN_CALLS)
        return this.loadEvents(fields)
      } else {
        currentRetryCount = 0
      }
    } else {
      currentRetryCount = 0
    }
  }
}
