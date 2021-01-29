import { Logger } from 'botpress/sdk'
import { RequestWithUser } from 'common/typings'
import Database from 'core/database'
import { UserRepository } from 'core/repositories'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { InvalidOperationError } from 'core/services/auth/errors'
import { SessionIdFactory } from 'core/services/dialog/session/id-factory'
import Joi from 'joi'
import { KeyValueStore } from 'core/services/kvs'
import { WorkspaceService } from 'core/services/workspace-service'
import { NextFunction, RequestHandler, Response, Router } from 'express'

import { CustomRouter } from '../customRouter'
import { checkTokenHeader, needPermissions, validateBodySchema } from '../util'

const USER_ID_MAX_LENGTH = 40
const validateUserId = (userId: string) => {
  if (!userId || userId.length > USER_ID_MAX_LENGTH || userId.toLowerCase() === 'undefined') {
    return false
  }

  return /[a-z0-9-_]+/i.test(userId)
}

const sanitizeName = (text: string) => text.replace(/\s/g, '-').replace(/[^a-zA-Z0-9\/_-]/g, '')

interface StartNodeEntry {
  flow: string
  node: string
  data?: any
}

const SetStartNodeSchema = Joi.object().keys({
  flow: Joi.string()
    .max(150)
    .allow('')
    .optional(),
  node: Joi.string()
    .max(50)
    .allow('')
    .optional(),
  id: Joi.string().max(150),
  label: Joi.string().max(150)
})

export class EmulatorRouter extends CustomRouter {
  private _checkTokenHeader: RequestHandler
  private _needPermissions: (operation: string, resource: string) => RequestHandler

  constructor(
    logger: Logger,
    private kvs: KeyValueStore,
    private database: Database,
    private userRepo: UserRepository,
    private authService: AuthService,
    private workspaceService: WorkspaceService
  ) {
    super('Emulator', logger, Router({ mergeParams: true }))
    this._needPermissions = needPermissions(this.workspaceService)
    this._checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.use(this._checkTokenHeader)

    //this._needPermissions('read', 'bot.content'),

    this.router.get(
      '/startNode/list',
      this.asyncMiddleware(async (req: RequestWithUser, res: Response) => {
        const { botId, userId } = req.params
        const kvs = this.kvs.forBot(botId)

        const list = await kvs.get(kvs.getUserStorageKey(req.tokenUser!.email, 'emulator/list'))

        res.send(list || [])
      })
    )

    this.router.post(
      '/startNode/set/:userId',
      this.asyncMiddleware(async (req: RequestWithUser, res: Response) => {
        validateBodySchema(req, SetStartNodeSchema)

        const { botId, userId } = req.params
        const { flow, node, id } = req.body
        const email = req.tokenUser!.email

        if (!validateUserId(userId)) {
          return res.status(400).send('User ID invalid')
        }

        if (id === 'custom' && flow?.endsWith('.flow.json') && node) {
          const threadId = await this.getRecentConversation(botId, userId)
          const session = await this.getSession(
            SessionIdFactory.createIdFromEvent({ target: userId, channel: 'web', botId, threadId })
          )

          console.log({ botId, userId, threadId, session })
          const { context, temp_data } = session || {}
          let payload: StartNodeEntry = { flow, node, data: undefined }

          if (context && context !== '{}') {
            payload.data = { context: JSON.parse(context), temp: JSON.parse(temp_data) }
          }

          const key = this.kvs.forBot(botId).getUserStorageKey(email, 'emulator/custom')
          await this.kvs.forBot(botId).set(key, payload)
        }

        await this.userRepo.updateAttributes('web', userId, { emulatorStartNode: `${email}//${id}` })

        res.sendStatus(200)
      })
    )

    this.router.post(
      '/startNode/save',
      this.asyncMiddleware(async (req: RequestWithUser, res: Response) => {
        validateBodySchema(
          req,
          Joi.object().keys({
            label: Joi.string()
              .max(150)
              .optional()
          })
        )

        const { label } = req.body

        const kvs = this.kvs.forBot(req.params.botId)
        const getStorageKey = name => kvs.getUserStorageKey(req.tokenUser!.email, `emulator/${name}`)

        const customInfo = await kvs.get(getStorageKey('custom'))
        if (customInfo) {
          const id = sanitizeName(label)

          await kvs.set(getStorageKey(id), customInfo)

          const list = (await kvs.get(getStorageKey(`list`))) || []
          list.push({ flow: customInfo.flow, node: customInfo.node, id, label })
          await kvs.set(getStorageKey('list'), list)
        }

        res.sendStatus(200)
      })
    )

    this.router.post(
      '/startNode/delete/:id',
      this.asyncMiddleware(async (req: RequestWithUser, res: Response) => {
        const { botId, id } = req.params
        const email = req.tokenUser!.email

        const kvs = this.kvs.forBot(botId)
        const getStorageKey = name => kvs.getUserStorageKey(email, `emulator/${name}`)

        await kvs.delete(getStorageKey(id))

        const newList = ((await kvs.get(getStorageKey('list'))) || []).filter(x => x.id !== id)
        await kvs.set(getStorageKey('list'), newList)

        res.sendStatus(200)
      })
    )
  }

  // Copied from channel-web
  async getRecentConversation(botId: string, userId: string) {
    const conversation = await this.database
      .knex('web_conversations')
      .select('id')
      .whereNotNull('last_heard_on')
      .andWhere({ userId, botId })
      .orderBy('last_heard_on', 'desc')
      .limit(1)
      .then()
      .get(0)

    return conversation?.id
  }

  async getSession(id: string) {
    const session = await this.database
      .knex('dialog_sessions')
      .where({ id })
      .select('*')
      .first()
      .then()

    return session
  }
}
