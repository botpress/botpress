import { Serialize } from 'cerialize'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

export class ActionsRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Actions', services)
  }

  setupRoutes() {
    const router = this.router
    router.get(
      '/',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.flows'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId

        const service = await this.actionService.forBot(botId)
        const actions = await service.listActions()
        res.send(Serialize(actions))
      })
    )

    router.get(
      '/actionServers',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.flows'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params

        const serversWithActions = await this.actionServersService.getServersWithActionsForBot(botId)

        res.send(serversWithActions)
      })
    )
  }
}
