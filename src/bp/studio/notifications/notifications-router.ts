import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

export class NotificationsRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Notifications', services)
  }

  setupRoutes() {
    const router = this.router
    router.get(
      '/',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.notifications'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const notifications = await this.notificationService.getInbox(botId)
        res.send(notifications)
      })
    )

    router.get(
      '/archive',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.notifications'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const notifications = await this.notificationService.getArchived(botId)
        res.send(notifications)
      })
    )

    router.post(
      '/:notificationId?/read',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.notifications'),
      this.asyncMiddleware(async (req, res) => {
        const notificationId = req.params.notificationId
        const botId = req.params.botId

        notificationId
          ? await this.notificationService.markAsRead(botId, notificationId)
          : await this.notificationService.markAllAsRead(botId)
        res.sendStatus(201)
      })
    )

    router.post(
      '/:notificationId?/archive',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.notifications'),
      this.asyncMiddleware(async (req, res) => {
        const notificationId = req.params.notificationId
        const botId = req.params.botId
        notificationId
          ? await this.notificationService.archive(botId, notificationId)
          : await this.notificationService.archiveAll(botId)
        res.sendStatus(201)
      })
    )
  }
}
