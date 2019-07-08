import { BotConfig, Logger } from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import { BotService } from 'core/services/bot-service'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'
import Joi from 'joi'
import _ from 'lodash'

import { CustomRouter } from '../customRouter'
import { ConflictError } from '../errors'
import { assertBotpressPro, needPermissions, success as sendSuccess } from '../util'

export class BotsRouter extends CustomRouter {
  public readonly router: Router

  private readonly resource = 'admin.bots'
  private needPermissions: (operation: string, resource: string) => RequestHandler
  private assertBotpressPro: RequestHandler
  private logger!: Logger

  constructor(
    logger: Logger,
    private workspaceService: WorkspaceService,
    private botService: BotService,
    private configProvider: ConfigProvider
  ) {
    super('Bots', logger, Router({ mergeParams: true }))
    this.logger = logger
    this.needPermissions = needPermissions(this.workspaceService)
    this.assertBotpressPro = assertBotpressPro(this.workspaceService)
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const workspace = await this.workspaceService.findWorkspace(req.workspace!)
        if (!workspace) {
          return res.sendStatus(404)
        }

        const botsRefs = await this.workspaceService.getBotRefs(workspace.id)
        const bots = await this.botService.findBotsByIds(botsRefs)

        return sendSuccess(res, 'Retrieved bots for all teams', {
          bots: bots && bots.filter(Boolean),
          workspace: _.pick(workspace, ['name', 'pipeline'])
        })
      })
    )

    router.get(
      '/categories',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const categories = (await this.configProvider.getBotpressConfig()).botCategories
        return sendSuccess(res, 'Retreived bot categories', { categories })
      })
    )

    router.post(
      '/',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const bot = <BotConfig>_.pick(req.body, ['id', 'name', 'category', 'defaultLanguage'])

        const botExists = (await this.botService.getBotsIds()).includes(bot.id)
        const botLinked = (await this.workspaceService.getBotRefs()).includes(bot.id)

        if (botExists && botLinked) {
          throw new ConflictError(`Bot "${bot.id}" already exists and is already linked in workspace`)
        }

        if (botExists) {
          this.logger.warn(`Bot "${bot.id}" already exists. Linking to workspace`)
        } else {
          const pipeline = await this.workspaceService.getPipeline(req.workspace!)

          bot.pipeline_status = {
            current_stage: {
              id: pipeline![0].id,
              promoted_on: new Date(),
              promoted_by: req.tokenUser!.email
            }
          }
          await this.botService.addBot(bot, req.body.template)
        }

        if (botLinked) {
          this.logger.warn(`Bot "${bot.id}" already linked in workspace. See workpaces.json for more details`)
        } else {
          await this.workspaceService.addBotRef(bot.id, req.workspace!)
        }

        return sendSuccess(res, 'Added new bot', {
          botId: bot.id
        })
      })
    )

    router.get(
      '/:botId/exists',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params

        return res.send(await this.botService.botExists(<string>botId))
      })
    )

    router.post(
      '/:botId/stage',
      this.assertBotpressPro,
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        try {
          await this.botService.requestStageChange(req.params.botId, req.tokenUser!.email)

          return res.sendStatus(200)
        } catch (err) {
          this.logger
            .forBot(req.params.botId)
            .attachError(err)
            .error(`Cannot request bot: ${req.params.botId} for stage change`)
          res.status(400)
        }
      })
    )

    router.put(
      '/:botId',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const bot = <BotConfig>req.body

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

        await this.botService.deleteBot(botId)
        await this.workspaceService.deleteBotRef(botId)

        return sendSuccess(res, 'Removed bot from team', { botId })
      })
    )

    router.get(
      '/:botId/export',
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const tarball = await this.botService.exportBot(botId)

        res.writeHead(200, {
          'Content-Type': 'application/tar+gzip',
          'Content-Disposition': `attachment; filename=bot_${botId}_${Date.now()}.tgz`,
          'Content-Length': tarball.length
        })
        res.end(tarball)
      })
    )

    router.post(
      '/:botId/import',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        if (!req.is('application/tar+gzip')) {
          res.status(400).send('Bot should be imported from archive')
        }
        const buffers: any[] = []
        req.on('data', chunk => {
          buffers.push(chunk)
        })
        req.on('end', async () => {
          const botId = req.params.botId
          try {
            await this.botService.importBot(botId, Buffer.concat(buffers), false)
            res.send('Ok')
          } catch (error) {
            res.status(500).send('Error while importing bot')
          }
        })
      })
    )

    router.get(
      '/:botId/revisions',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const revisions = await this.botService.listRevisions(botId)

        return sendSuccess(res, 'Bot revisions', {
          revisions
        })
      })
    )

    router.post(
      '/:botId/revisions',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        await this.botService.createRevision(botId)
        return sendSuccess(res, `Created a new revision for bot ${botId}`)
      })
    )

    router.post(
      '/:botId/rollback',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        Joi.validate(req.body, { revision: Joi.string() })

        await this.botService.rollback(botId, req.body.revision)

        return sendSuccess(res, `Created a new revision for bot ${botId}`)
      })
    )
  }
}
