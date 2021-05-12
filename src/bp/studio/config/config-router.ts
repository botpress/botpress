import { BotConfig } from 'botpress/sdk'
import { Serialize } from 'cerialize'
import { UnexpectedError } from 'common/http'
import { sendSuccess } from 'core/routers'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

export class ConfigRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Config', services)
  }

  setupRoutes() {
    const router = this.router
    router.get(
      '/',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.information'),
      this.asyncMiddleware(async (req, res) => {
        const bot = await this.botService.findBotById(req.params.botId)
        if (!bot) {
          return res.sendStatus(404)
        }

        res.send(bot)
      })
    )

    router.post(
      '/',
      this.needPermissions('write', 'bot.information'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const bot = <BotConfig>req.body

        try {
          await this.botService.updateBot(botId, bot)
          return sendSuccess(res, 'Updated bot', { botId })
        } catch (err) {
          throw new UnexpectedError('Cannot update bot configuration', err)
        }
      })
    )
  }
}
