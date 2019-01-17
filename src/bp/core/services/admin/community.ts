import { BotTemplate } from 'botpress/sdk'
import { checkRule } from 'common/auth'
import { BotCreationSchema, BotEditSchema } from 'common/validation'
import { BotLoader } from 'core/bot-loader'
import { BotConfigWriter } from 'core/config'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { AuthRule, Bot } from 'core/misc/interfaces'
import { saltHashPassword } from 'core/services/auth/util'
import { Statistics } from 'core/stats'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import Joi from 'joi'
import _ from 'lodash'
import nanoid from 'nanoid'

import { InvalidOperationError, UnauthorizedAccessError } from '../auth/errors'
import { WorkspaceService } from '../workspace'

import { FeatureNotAvailableError } from './errors'
import { AdminService } from './service'

@injectable()
export class CommunityAdminService implements AdminService {
  protected ROOT_ADMIN_ID = 1

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.BotLoader) private botLoader: BotLoader,
    @inject(TYPES.BotConfigWriter) private botConfigWriter: BotConfigWriter,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Statistics) protected stats: Statistics,
    @inject(TYPES.WorkspaceService) protected workspace: WorkspaceService
  ) {}

  protected get knex() {
    return this.database.knex!
  }

  listUsers() {
    throw new FeatureNotAvailableError()
  }

  createUser(username: string) {
    throw new FeatureNotAvailableError()
  }

  deleteUser(userId: number) {
    throw new FeatureNotAvailableError()
  }

  async resetPassword(userId: number) {
    const password = nanoid(15)
    const { hash, salt } = saltHashPassword(password)

    await this.workspace.updateUser(Number(userId), {
      password: hash,
      salt,
      password_expired: true
    })

    return password
  }

  async updateUserProfile(userId: number, firstname: string, lastname: string) {
    await this.workspace.updateUser(userId, { firstname, lastname })
  }

  async addBot(bot: Bot, botTemplate?: BotTemplate): Promise<void> {
    this.stats.track('ce', 'addBot')

    const { error } = Joi.validate(bot, BotCreationSchema)
    if (error) {
      throw new InvalidOperationError(`An error occurred while creating the bot: ${error.message}`)
    }

    botTemplate
      ? await this.botConfigWriter.createFromTemplate(bot, botTemplate)
      : await this.botConfigWriter.createEmptyBot(bot)

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

  async getUserPermissions(userId: number): Promise<AuthRule[]> {
    return []
    // const roleName = await this.getUserRole(userId, teamId)
    //  const role = await this.getRole({ team: teamId, name: roleName }, ['rules'])

    // return (role && role.rules!) || []
  }

  /*async getUserRole(userId: number, teamId: number) {
    const member = await this.getMembership({ user: userId, team: teamId }, ['role'])

    if (!member) {
      throw new UnauthorizedAccessError('Not a member of this team')
    }

    const role = await this.getRole({ team: teamId, id: member.role! }, ['name'])

    return role.name!
  }

  changeUserRole(userId: number, teamId: number, roleName: string) {
    throw new FeatureNotAvailableError()
  }*/
  /*
  async assertUserPermission(userId: number, teamId: number, resource: string, operation: string) {
    const permissions = await this.getUserPermissions(userId, teamId)

    if (!checkRule(permissions, operation, resource)) {
      throw new UnauthorizedAccessError('User does not have permission to perform this operation')
    }
  }

  async assertUserNotMember(userId: number, teamId: number) {
    const member = await this.getMembership({ user: userId, team: teamId }, ['id'])

    if (member) {
      throw new InvalidOperationError('User is already part of the team')
    }
  }

  async assertRoleExists(teamId: number, roleName: string) {
    const role = await this.getRole({ team: teamId, name: roleName }, ['id'])

    if (!role) {
      throw new InvalidOperationError(`Role "${roleName}" doesn't exist`)
    }
  }

  async assertUserRole(userId: number, teamId: number, roleName: string) {
    const isMember = await this.getMembership({ user: userId, team: teamId, role: roleName }, ['role'])

    if (!isMember) {
      throw new UnauthorizedAccessError(`User does not have role ${roleName} in the team`)
    }
  }*/

  async assertIsRootAdmin(userId: number) {
    if (userId !== this.ROOT_ADMIN_ID) {
      throw new UnauthorizedAccessError(`Only root admin is allowed to use this`)
    }
  }

  /*protected async getRole(where: {}, select?: Array<keyof AuthRole>) {
    return this.knex(this.rolesTable)
      .select(select || ['*'])
      .where(where)
      .limit(1)
      .get(0)
      .then(res => {
        // Issue: sqlite doesnt parse json objects
        // TODO: Write a json parser for sqlite
        if (this.knex.isLite && (!select || select.includes('rules'))) {
          res.rules = JSON.parse(res.rules)
        }
        return res
      })
  }*/
  /*
  protected async getMembership(where: {}, select?: Array<keyof AuthTeamMembership>) {
    return this.knex(this.membersTable)
      .select(select || ['*'])
      .where(where)
      .limit(1)
      .then<Partial<AuthTeamMembership>[]>(res => res)
      .get(0)
  }

  protected async getTeam(where: {}, select?: Array<keyof AuthTeam>): Promise<Partial<AuthTeam | undefined>> {
    return this.knex(this.teamsTable)
      .select(select || ['*'])
      .where(where)
      .limit(1)
      .then<Partial<AuthTeam>[]>(res => res)
      .get(0)
  }*/
}
