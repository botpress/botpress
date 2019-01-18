import { Logger } from 'botpress/sdk'
import { WorkspaceService } from 'core/services/workspace'
import { Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '..'
import { Bot } from '../../misc/interfaces'
import { asyncMiddleware, success as sendSuccess } from '../util'

export class BotsRouter implements CustomRouter {
  public readonly router: Router

  private asyncMiddleware!: Function

  constructor(logger: Logger, private workspace: WorkspaceService) {
    this.asyncMiddleware = asyncMiddleware({ logger })
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/',
      this.asyncMiddleware(async (req, res) => {
        const userId = req.authUser.id
        this.workspace.assertUserExists(userId)

        const { bots } = await this.workspace.listBots()

        return sendSuccess(res, 'Retrieved bots for all teams', bots)
      })
    )

    router.post(
      '/', // Add new bot
      this.asyncMiddleware(async (req, res) => {
        const bot = <Bot>_.pick(req.body, ['id', 'name'])
        const userId = req.authUser.id
        this.workspace.assertUserExists(userId)

        await this.workspace.addBot(bot, req.body.template)

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
        const userId = req.authUser.id
        this.workspace.assertUserExists(userId)

        await this.workspace.updateBot(botId, bot)

        return sendSuccess(res, 'Updated bot', {
          botId
        })
      })
    )

    router.delete(
      '/:botId', // Delete a bot
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const userId = req.authUser.id
        this.workspace.assertUserExists(userId)

        await this.workspace.deleteBot(botId)

        return sendSuccess(res, 'Removed bot from team', { botId })
      })
    )
  }
}
