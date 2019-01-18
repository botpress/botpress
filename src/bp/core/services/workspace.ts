import { BotTemplate, Logger } from 'botpress/sdk'
import { BotCreationSchema, BotEditSchema } from 'common/validation'
import { BotLoader } from 'core/bot-loader'
import { BotConfigWriter } from 'core/config'
import { ConfigProvider } from 'core/config/config-loader'
import { AuthRole, AuthUser, BasicAuthUser, Bot, Workspace } from 'core/misc/interfaces'
import { Statistics } from 'core/stats'
import { inject, injectable, tagged } from 'inversify'
import Joi from 'joi'
import _ from 'lodash'

import { TYPES } from '../types'

import defaultRoles from './admin/default-roles'
import { InvalidOperationError, UnauthorizedAccessError } from './auth/errors'
import { GhostService } from './ghost/service'

@injectable()
export class WorkspaceService {
  protected ROOT_ADMIN_ID = 1 // FIXME: UserIds will disapear to favor email address. Use a flag instead.

  private _workspace!: Workspace

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'WorkspaceService')
    private logger: Logger,
    @inject(TYPES.BotLoader) private botLoader: BotLoader,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.BotConfigWriter) private configWriter: BotConfigWriter,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.Statistics) private stats: Statistics
  ) {}

  async initialize(): Promise<void> {
    try {
      const workspaces = await this.ghost.global().readFileAsObject<Workspace[]>('/', `workspaces.json`)
      this._workspace = workspaces[0]
    } catch (error) {
      if (error.code === 'ENOENT') {
        this._workspace = this.getDefaultWorkspace()
      } else {
        this.logger.attachError(error).error(`Error loading workspace`)
      }
    }
  }

  async addBot(bot: Bot, botTemplate?: BotTemplate): Promise<void> {
    this.stats.track('ce', 'addBot')

    const { error } = Joi.validate(bot, BotCreationSchema)
    if (error) {
      throw new InvalidOperationError(`An error occurred while creating the bot: ${error.message}`)
    }

    botTemplate
      ? await this.configWriter.createFromTemplate(bot, botTemplate)
      : await this.configWriter.createEmptyBot(bot)

    await this.botLoader.mountBot(bot.id)
  }

  async updateBot(botId: string, bot: Bot): Promise<void> {
    this.stats.track('ce', 'updateBot')

    const { error } = Joi.validate(bot, BotEditSchema)
    if (error) {
      throw new InvalidOperationError(`An error occurred while updating the bot: ${error.message}`)
    }

    const actualBot = await this.configProvider.getBotConfig(botId)
    actualBot.name = bot.name
    actualBot.description = bot.description
    await this.configProvider.setBotConfig(botId, actualBot)
  }

  async deleteBot(botId: string) {
    await this.botLoader.unmountBot(botId)
    /*await this.knex(this.botsTable)
      .where({ team: teamId, id: botId })
      .del()*/
  }

  async listBots() {
    const bots = await this.botLoader.getAllBots()
    // console.log(bots.values())
    return { count: bots.size, bots: [...bots.values()] }
    /*const query = this.knex(this.botsTable)
      .where({ team: teamId })
      .select('*')

    if (offset && limit) {
      query.offset(offset).limit(limit)
    }

    const bots = await query.then<Array<Bot>>(res => res)

    return { count: bots.length, bots }*/
  }

  async save() {
    const workspaces = [this._workspace]
    this.ghost.global().upsertFile('/', `workspaces.json`, JSON.stringify(workspaces, undefined, 2))
  }

  listUsers(selectFields?: Array<keyof AuthUser>): Partial<AuthUser[]> {
    if (!selectFields) {
      return this._workspace.users
    } else {
      return _.map(this._workspace.users, x => _.pick(x, selectFields))
    }
  }

  assertUserExists(userId: string): void {
    const user = this.findUser({ id: userId })
    if (!user) {
      throw new Error(`User "${userId}" is not a part of the workspace "${this._workspace.name}"`)
    }
  }

  async assertIsRootAdmin(userId: number) {
    if (userId !== this.ROOT_ADMIN_ID) {
      throw new UnauthorizedAccessError(`Only root admin is allowed to use this`)
    }
  }

  findUser(where: {}, selectFields?: Array<keyof AuthUser>): AuthUser | undefined {
    const user = _.head(_.filter(this._workspace.users, where))
    // return selectFields ? _.pick(user, selectFields) : user
    return user
  }

  findRole(name: string): AuthRole {
    const role = this._workspace.roles.find(r => r.name === name)
    if (!role) {
      throw new Error(`Role "${name}" does not exists in workspace "${this._workspace.name}"`)
    }
    return role
  }

  getRoleForUser(userId): AuthRole {
    const user = this.findUser({ id: userId })!
    return this.findRole(user.role!)
  }

  async createUser(authUser: BasicAuthUser): Promise<AuthUser> {
    const newUser: AuthUser = {
      ...authUser,
      id: ++this._workspace.userSeq
    }

    this._workspace.users.push(newUser)
    await this.save()

    return newUser
  }

  async updateUser(userId: number, userData: Partial<AuthUser>) {
    const original = this.findUser({ id: userId })
    if (!original) {
      throw Error('Cannot find user')
    }

    const newUser: AuthUser = {
      ...original,
      ...userData
    }
    const idx = _.findIndex(this._workspace!.users, x => x.id === userId)
    this._workspace.users.splice(idx, 1, newUser)

    await this.save()
  }

  async deleteUser(userId: number) {
    const index = _.findIndex(this._workspace.users, x => x.id === userId)

    if (index > -1) {
      this._workspace.users.splice(index, 1)
      await this.save()
    }
  }

  getDefaultWorkspace() {
    return {
      name: 'default',
      userSeq: 0,
      users: [],
      roles: defaultRoles
    }
  }
}
