import { Logger } from 'botpress/sdk'
import { BotService } from 'core/services/bot-service'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '..'
import { Bot } from '../../misc/interfaces'
import { ConflictError } from '../errors'
import { asyncMiddleware, needPermissions, success as sendSuccess } from '../util'

export class BotsRouter implements CustomRouter {
  public readonly router: Router

  private readonly resource = 'admin.bots'
  private asyncMiddleware!: Function
  private needPermissions: (operation: string, resource: string) => RequestHandler
  private logger!: Logger

  constructor(logger: Logger, private workspaceService: WorkspaceService, private botService: BotService) {
    this.logger = logger
    this.asyncMiddleware = asyncMiddleware({ logger })
    this.needPermissions = needPermissions(this.workspaceService)
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        this.workspaceService.assertUserExists(req.tokenUser.email)

        const botsRefs = await this.workspaceService.getBotRefs()
        const bots = await this.botService.findBotsByIds(botsRefs)
        const workpace = await this.workspaceService.getWorkspace()

        return sendSuccess(res, 'Retrieved bots for all teams', {
          bots: bots && bots.filter(Boolean),
          workspace: workpace.name
        })
      })
    )

    router.post(
      '/',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const bot = <Bot>_.pick(req.body, ['id', 'name'])

        this.workspaceService.assertUserExists(req.tokenUser.email)

        const botExists = (await this.botService.getBotsIds()).includes(bot.id)
        const botLinked = (await this.workspaceService.getBotRefs()).includes(bot.id)

        if (botExists && botLinked) {
          throw new ConflictError(`Bot "${bot.id}" already exists and is already linked in workspace`)
        }

        if (botExists) {
          this.logger.warn(`Bot "${bot.id}" already exists. Linking to workspace`)
        } else {
          await this.botService.addBot(bot, req.body.template)
        }

        if (botLinked) {
          this.logger.warn(`Bot "${bot.id}" already linked in workspace. See workpaces.json for more details`)
        } else {
          await this.workspaceService.addBotRef(bot.id)
        }

        return sendSuccess(res, 'Added new bot', {
          botId: bot.id
        })
      })
    )

    router.put(
      '/:botId',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const bot = <Bot>req.body
        this.workspaceService.assertUserExists(req.tokenUser.email)

        await this.botService.updateBot(botId, bot)

        return sendSuccess(res, 'Updated bot', {
          botId
        })
      })
    )

    router.delete(
      '/:botId',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        this.workspaceService.assertUserExists(req.tokenUser.email)

        await this.botService.deleteBot(botId)
        await this.workspaceService.deleteBotRef(botId)

        return sendSuccess(res, 'Removed bot from team', { botId })
      })
    )
  }
}
