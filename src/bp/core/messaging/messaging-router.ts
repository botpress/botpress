import * as sdk from 'botpress/sdk'
import { HTTPServer } from 'core/app/server'
import { CustomRouter } from 'core/routers/customRouter'
import { Router } from 'express'
import { MessagingService } from './messaging-service'

export class MessagingRouter extends CustomRouter {
  constructor(private logger: sdk.Logger, private messaging: MessagingService, private http: HTTPServer) {
    super('Messaging', logger, Router({ mergeParams: true }))
  }

  public setupRoutes(): void {
    this.router.post('/messaging/receive', async (req, res) => {
      const msg = req.body

      await this.messaging.receive(
        msg.client.id,
        msg.channel.name,
        msg.user.id,
        msg.conversation.id,
        msg.message.payload
      )

      res.sendStatus(200)
    })

    for (const channel of this.messaging.channels) {
      channel.setupRoutes(this.http)
    }
  }
}
