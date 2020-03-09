import { BotConfig, Logger } from 'botpress/sdk'
import { RequestWithUser } from 'common/typings'
import { ConfigProvider } from 'core/config/config-loader'
import { BotService } from 'core/services/bot-service'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'
import Joi from 'joi'
import _ from 'lodash'
import yn from 'yn'

import { CustomRouter } from '../customRouter'
import { ConflictError, ForbiddenError } from '../errors'
import {
  assertBotpressPro,
  assertSuperAdmin,
  assertWorkspace,
  hasPermissions,
  needPermissions,
  success as sendSuccess
} from '../util'

const chatUserBotFields = [
  'id',
  'name',
  'description',
  'disabled',
  'locked',
  'private',
  'defaultLanguage',
  'pipeline_status.current_stage.id'
]

export class BotsRouter extends CustomRouter {
  public readonly router: Router

  private readonly resource = 'admin.bots'
  private needPermissions: (operation: string, resource: string) => RequestHandler
  private hasPermissions: (req: RequestWithUser, operation: string, resource: string) => Promise<boolean>
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
    this.hasPermissions = hasPermissions(this.workspaceService)
    this.assertBotpressPro = assertBotpressPro(this.workspaceService)
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/',
      assertWorkspace,
      this.asyncMiddleware(async (req, res) => {
        const isBotAdmin = await this.hasPermissions(req, 'read', this.resource)
        const isChatUser = await this.hasPermissions(req, 'read', 'user.bots')
        if (!isBotAdmin && !isChatUser) {
          throw new ForbiddenError(`No permission to view bots`)
        }

        const workspace = await this.workspaceService.findWorkspace(req.workspace!)
        const botsRefs = await this.workspaceService.getBotRefs(workspace.id)
        const bots = (await this.botService.findBotsByIds(botsRefs)).filter(Boolean)

        return sendSuccess(res, 'Retrieved bots', {
          bots: isBotAdmin ? bots : bots.map(b => _.pick(b, chatUserBotFields)),
          workspace: _.pick(workspace, ['name', 'pipeline'])
        })
      })
    )

    router.get(
      '/byWorkspaces',
      assertSuperAdmin,
      this.asyncMiddleware(async (_req, res) => {
        const workspaces = await this.workspaceService.getWorkspaces()
        const bots = workspaces.reduce((obj, workspace) => {
          obj[workspace.id] = workspace.bots
          return obj
        }, {})

        return sendSuccess(res, 'Retrieved bots', { bots })
      })
    )

    router.get(
      '/categories',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const categories = (await this.configProvider.getBotpressConfig()).botCategories
        return sendSuccess(res, 'Retrieved bot categories', { categories })
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
          this.logger.warn(`Bot "${bot.id}" already linked in workspace. See workspaces.json for more details`)
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
          res.status(400).send(err.message)
        }
      })
    )

    router.post(
      '/:botId/approve-stage',
      this.assertBotpressPro,
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        try {
          await this.botService.approveStageChange(req.params.botId, req.tokenUser!.email, req.tokenUser!.strategy)

          return res.sendStatus(200)
        } catch (err) {
          this.logger
            .forBot(req.params.botId)
            .attachError(err)
            .error(`Cannot request bot: ${req.params.botId} for stage change`)
          res.status(400).send(err.message)
        }
      })
    )

    router.post(
      '/:botId',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const bot = <BotConfig>req.body

        try {
          await this.botService.updateBot(botId, bot)
          return sendSuccess(res, 'Updated bot', {
            botId
          })
        } catch (err) {
          this.logger
            .forBot(req.params.botId)
            .attachError(err)
            .error(`Cannot update bot: ${botId}`)

          res.status(400).send(err.message)
        }
      })
    )

    router.post(
      '/:botId/delete',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params

        try {
          await this.botService.deleteBot(botId)
          await this.workspaceService.deleteBotRef(botId)
          return sendSuccess(res, 'Removed bot from team', { botId })
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .error(`Could not delete bot: ${botId}`)

          res.status(400).send(err.message)
        }
      })
    )

    router.get(
      '/:botId/export',
      this.needPermissions('read', this.resource),
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
          return res.status(400).send('Bot should be imported from archive')
        }

        const buffers: any[] = []
        req.on('data', chunk => buffers.push(chunk))
        await Promise.fromCallback(cb => req.on('end', cb))

        const overwrite = yn(req.query.overwrite)
        await this.botService.importBot(req.params.botId, Buffer.concat(buffers), req.workspace!, overwrite)
        res.sendStatus(200)
      })
    )

    router.get(
      '/:botId/revisions',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        try {
          const revisions = await this.botService.listRevisions(botId)
          return sendSuccess(res, 'Bot revisions', {
            revisions
          })
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .error(`Could not list revisions for bot ${botId}`)
          res.status(400).send(err.message)
        }
      })
    )

    router.post(
      '/:botId/revisions',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        try {
          await this.botService.createRevision(botId)
          return sendSuccess(res, `Created a new revision for bot ${botId}`)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .error(`Could not create revision for bot: ${botId}`)
          res.status(400).send(err.message)
        }
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

    router.get(
      '/health',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        return sendSuccess(res, 'Retrieved bot health', await this.botService.getBotHealth())
      })
    )

    router.post(
      '/:botId/reload',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId

        await this.botService.unmountBot(botId)
        const success = await this.botService.mountBot(botId)

        return success ? sendSuccess(res, `Reloaded bot ${botId}`) : res.sendStatus(400)
      })
    )
  }
}
