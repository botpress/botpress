import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'

class ChannelsRouter extends CustomAdminRouter {
  constructor(services: AdminServices) {
    super('Channels', services)
    this.setupRoutes()
  }

  private setupRoutes() {
    this.router.get(
      '/clients',
      this.asyncMiddleware(async (req, res) => {
        const entries = await this.messagingService.entries.list()
        res.send(entries)
      })
    )

    this.router.get(
      '/clients/:clientId',
      this.asyncMiddleware(async (req, res) => {
        const entry = await this.messagingService.entries.get(req.params.clientId)
        res.send(entry?.config || {})
      })
    )

    this.router.post(
      '/clients/:clientId',
      this.asyncMiddleware(async (req, res) => {
        await this.messagingService.entries.update(req.params.clientId, req.body)

        const entry = await this.messagingService.entries.get(req.params.clientId)
        await this.messagingService.lifetime.reloadMessagingForBot(entry!.botId)

        res.sendStatus(200)
      })
    )
  }
}

export default ChannelsRouter
