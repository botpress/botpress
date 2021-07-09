import * as sdk from 'botpress/sdk'
import { HTTPServer } from 'core/app/server'
import { ChannelConfigEntry } from 'core/config'
import { CustomRouter } from 'core/routers/customRouter'
import { Router } from 'express'
import { MessagingService } from './messaging-service'

export class MessagingRouter extends CustomRouter {
  constructor(private logger: sdk.Logger, private messaging: MessagingService, private http: HTTPServer) {
    super('Messaging', logger, Router({ mergeParams: true }))
  }

  public setupRoutes(channelsConfig: ChannelConfigEntry[]): void {
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
      // Check if channel is enabled Botpress-wide
      const channelConfig = channelsConfig.find(c => c.name === channel.name)
      if (!channelConfig || !channelConfig.enabled) {
        continue
      }

      channel.setupRoutes(this.http)
    }
  }
}
