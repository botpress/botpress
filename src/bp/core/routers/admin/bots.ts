import { Logger } from 'botpress/sdk'
import { AdminService } from 'core/services/admin/service'
import { Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '..'
import { Bot } from '../../misc/interfaces'
import AuthService from '../../services/auth/auth-service'
import { asyncMiddleware, success as sendSuccess } from '../util'

export class BotsRouter implements CustomRouter {
  private asyncMiddleware!: Function
  public readonly router: Router

  constructor(private logger: Logger, private authService: AuthService, private adminService: AdminService) {
    this.asyncMiddleware = asyncMiddleware({ logger })
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router
    const svc = this.adminService

    router.get(
      '/',
      this.asyncMiddleware(async (req, res) => {
        const { bots } = await this.adminService.listBots()

        return sendSuccess(res, 'Retrieved bots for all teams', bots)
      })
    )

    router.post(
      '/', // Add new bot
      this.asyncMiddleware(async (req, res) => {
        const bot = <Bot>_.pick(req.body, ['id', 'name'])

        await svc.addBot(bot, req.body.template)

        return sendSuccess(res, 'Added new bot', {
          botId: bot.id
        })
      })
    )

    router.put(
      '/:botId', // Update bot
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const bot = <Bot>req.body

        await svc.updateBot(botId, bot)

        return sendSuccess(res, 'Updated bot', {
          botId
        })
      })
    )

    router.delete(
      '/:botId', // Delete a bot
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params

        await svc.deleteBot(botId)

        return sendSuccess(res, 'Removed bot from team', { botId })
      })
    )
  }
}
