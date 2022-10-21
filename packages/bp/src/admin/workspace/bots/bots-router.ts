import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import { BotConfig } from 'botpress/sdk'
import { UnexpectedError } from 'common/http'
import { ConflictError, ForbiddenError, sendSuccess } from 'core/routers'
import { assertSuperAdmin, assertWorkspace } from 'core/security'
import Joi from 'joi'
import _ from 'lodash'
import yn from 'yn'

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

class BotsRouter extends CustomAdminRouter {
  private readonly resource = 'admin.bots'

  constructor(services: AdminServices) {
    super('Bots', services)
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
          throw new ForbiddenError('No permission to view bots')
        }

        const workspace = await this.workspaceService.findWorkspace(req.workspace!)
        const botsRefs = await this.workspaceService.getBotRefs(workspace.id)
        const bots = (await this.botService.findBotsByIds(botsRefs)).filter(Boolean)

        return sendSuccess(res, 'Retrieved bots', {
          bots: isBotAdmin ? bots : bots.map(b => _.pick(b, chatUserBotFields)),
          workspace: _.pick(workspace, ['name', 'pipeline', 'botPrefix'])
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

    this.router.get(
      '/templates',
      this.asyncMiddleware(async (_req, res, _next) => {
        res.send(this.moduleLoader.getBotTemplates())
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

    const assertBotInWorkspace = async (botId: string, workspaceId?: string) => {
      const botExists = (await this.botService.getBotsIds()).includes(botId)
      const isBotInCurrentWorkspace = (await this.workspaceService.getBotRefs(workspaceId)).includes(botId)

      if (botExists && !isBotInCurrentWorkspace) {
        throw new ConflictError(`Bot "${botId}" already exists in another workspace. Bot ID are unique server-wide`)
      }
    }

    router.post(
      '/',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const bot = <BotConfig>_.pick(req.body, ['id', 'name', 'category', 'defaultLanguage'])

        await assertBotInWorkspace(bot.id, req.workspace)

        const botExists = (await this.botService.getBotsIds()).includes(bot.id)
        const botLinked = (await this.workspaceService.getBotRefs()).includes(bot.id)

        bot.id = await this.botService.makeBotId(bot.id, req.workspace!)

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
        const botId = await this.botService.makeBotId(req.params.botId, req.workspace!)

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
          throw new UnexpectedError('Cannot request state change for bot', err)
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
          throw new UnexpectedError('Cannot approve state change for bot', err)
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
          throw new UnexpectedError('Cannot delete bot', err)
        }
      })
    )

    router.get(
      '/:botId/export',
      this.needPermissions('read', `${this.resource}.archive`),
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
      this.needPermissions('write', `${this.resource}.archive`),
      this.asyncMiddleware(async (req, res) => {
        if (!req.is('application/tar+gzip')) {
          return res.status(400).send('Bot should be imported from archive')
        }

        const overwrite = yn(req.query.overwrite)
        const botId = await this.botService.makeBotId(req.params.botId, req.workspace!)

        if (overwrite) {
          await assertBotInWorkspace(botId, req.workspace)
        }

        const buffers: any[] = []
        req.on('data', chunk => buffers.push(chunk))
        await Promise.fromCallback(cb => req.on('end', cb))

        await this.botService.importBot(botId, Buffer.concat(buffers), req.workspace!, overwrite)
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
          throw new UnexpectedError('Cannot list revisions for bot', err)
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
          throw new UnexpectedError('Cannot create new revision for bot', err)
        }
      })
    )

    router.post(
      '/:botId/rollback',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        await Joi.validate(req.body, { revision: Joi.string() })

        await this.botService.rollback(botId, req.body.revision)

        return sendSuccess(res, `Created a new revision for bot ${botId}`)
      })
    )

    router.get(
      '/health',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        return sendSuccess(res, 'Retrieved bot health', await this.botService.getBotHealth(req.workspace || 'default'))
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

export default BotsRouter
