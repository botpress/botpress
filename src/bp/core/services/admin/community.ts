import { Logger } from 'botpress/sdk'
import { BotLoader } from 'core/bot-loader'
import { BotConfigFactory, BotConfigWriter } from 'core/config'
import Database from 'core/database'
import { checkRule } from 'core/misc/auth'
import { AuthRole, AuthRoleDb, AuthRule, AuthTeam, AuthTeamMembership, AuthUser, Bot } from 'core/misc/interfaces'
import { BOTID_REGEX } from 'core/misc/validation'
import { saltHashPassword } from 'core/services/auth/util'
import { Statistics } from 'core/stats'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import Joi from 'joi'
import Knex from 'knex'
import _ from 'lodash'
import nanoid from 'nanoid'

import { GhostService } from '..'
import { InvalidOperationError, UnauthorizedAccessError } from '../auth/errors'

import communityRoles from './community-roles'
import { FeatureNotAvailableError } from './errors'
import { AdminService } from './service'

@injectable()
export class CommunityAdminService implements AdminService {
  protected teamsTable = 'auth_teams'
  protected membersTable = 'auth_team_members'
  protected rolesTable = 'auth_roles'
  protected usersTable = 'auth_users'
  protected botsTable = 'srv_bots'
  protected ROOT_ADMIN_ID = 1

  protected botValidationSchema = Joi.object().keys({
    id: Joi.string()
      .regex(BOTID_REGEX)
      .required(),
    name: Joi.string().required(),
    description: Joi.string(),
    team: Joi.number().required()
  })

  private edition = process.BOTPRESS_EDITION

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.BotConfigFactory) private botConfigFactory: BotConfigFactory,
    @inject(TYPES.BotConfigWriter) private botConfigWriter: BotConfigWriter,
    @inject(TYPES.BotLoader) private botLoader: BotLoader,
    @inject(TYPES.Statistics) private stats: Statistics
  ) {}

  protected get knex() {
    return this.database.knex!
  }

  listUsers() {
    throw new FeatureNotAvailableError(this.edition)
  }

  createUser(username: string) {
    throw new FeatureNotAvailableError(this.edition)
  }

  deleteUser(userId: number) {
    throw new FeatureNotAvailableError(this.edition)
  }

  async resetPassword(userId: any) {
    const password = nanoid(15)
    const { hash, salt } = saltHashPassword(password)

    await this.knex(this.usersTable)
      .update({ password: hash, salt, password_expired: true })
      .where({ id: userId })

    return password
  }

  async updateUserProfile(userId: number, firstname: string, lastname: string) {
    await this.knex(this.usersTable)
      .update({ firstname, lastname })
      .where({ id: userId })
  }

  addMemberToTeam(userId: number, teamId: number, roleName: string) {
    throw new FeatureNotAvailableError(this.edition)
  }

  removeMemberFromTeam(userId: any, teamId: any) {
    throw new FeatureNotAvailableError(this.edition)
  }

  async listUserTeams(userId: number) {
    const table = this.membersTable
    return this.knex
      .from(function(this: Knex) {
        this.from(table)
          .where({ user: userId })
          .as('m')
      })
      .leftJoin(this.knex(this.teamsTable).as('t'), 'm.team', 't.id')
      .leftJoin(this.knex(this.rolesTable).as('r'), 'm.role', 'r.id')
      .select(
        this.knex.raw('m.user as userId'),
        this.knex.raw('m.team as id'),
        this.knex.raw('r.name as role'),
        't.name'
      )
  }

  createTeamRole(teamId: number, role: AuthRole) {
    throw new FeatureNotAvailableError(this.edition)
  }

  deleteTeamRole(teamId: number, roleId: number) {
    throw new FeatureNotAvailableError(this.edition)
  }

  updateTeamRole(teamId: number, roleId: number, role: Partial<AuthRole>) {
    throw new FeatureNotAvailableError(this.edition)
  }

  async listTeamRoles(teamId: number) {
    return this.knex(this.rolesTable)
      .select('id', 'name', 'description', 'rules', 'created_at', 'updated_at')
      .where({ team: teamId })
      .then<Array<AuthRoleDb>>(res => res)
      .map(
        r =>
          ({
            ...r,
            rules: JSON.parse(r.rules) as Array<AuthRule>
          } as AuthRole)
      )
  }

  async addBot(teamId: number, bot: Bot): Promise<void> {
    this.stats.track('api', 'admin', 'addBot')
    bot.team = teamId
    const { error } = Joi.validate(bot, this.botValidationSchema)
    if (error) {
      throw new Error(`An error occurred while creating the bot: ${error.message}`)
    }

    await this.knex(this.botsTable).insert(bot)
    const botConfig = this.botConfigFactory.createDefault({ id: bot.id, name: bot.name })
    await this.botConfigWriter.writeToFile(botConfig)

    await this.botLoader.mountBot(bot.id, true)
  }

  async deleteBot(teamId: number, botId: string) {
    await this.knex(this.botsTable)
      .where({ team: teamId, id: botId })
      .delete()
      .then()

    await this.botLoader.unmountBot(botId)
  }

  async listBots(teamId: number, offset?: number, limit?: number) {
    const query = this.knex(this.botsTable)
      .where({ team: teamId })
      .select('id', 'name', 'description', 'created_at')

    if (offset && limit) {
      query.offset(offset).limit(limit)
    }

    const bots = await query.then<Array<Bot>>(res => res)

    return { count: bots.length, bots }
  }

  async createNewTeam({ userId, name = 'Default Team' }: { userId: number; name?: string }) {
    const teamId = await this.knex.insertAndRetrieve<number>(this.teamsTable, {
      name
    })

    if (_.isArray(communityRoles) && communityRoles.length) {
      await this.knex.batchInsert(
        this.rolesTable,
        communityRoles.map(role => {
          return { ...role, team: teamId, rules: JSON.stringify(role.rules) }
        })
      )
    }

    await this.addMemberToTeam(userId, teamId, 'owner')

    return teamId
  }

  async getBotTeam(botId: string) {
    return this.knex(this.botsTable)
      .select(['team'])
      .where({ id: botId })
      .limit(1)
      .then<Partial<Bot>[]>(res => res)
      .get(0)
      .then(bot => {
        return bot ? bot.team : undefined
      })
  }

  async deleteTeam(teamId: number) {
    return this.knex(this.teamsTable)
      .where('id', teamId)
      .delete()
      .then()
  }

  async getUserPermissions(userId: number, teamId: number): Promise<AuthRule[]> {
    const roleName = await this.getUserRole(userId, teamId)

    const role = await this.getRole({ team: teamId, name: roleName }, ['rules'])

    return (role && JSON.parse(role.rules!)) || []
  }

  async getUserRole(userId: number, teamId: number) {
    const member = await this.getMembership({ user: userId, team: teamId }, ['role'])

    if (!member) {
      throw new UnauthorizedAccessError('Not a member of this team')
    }

    const role = await this.getRole({ team: teamId, id: member.role! }, ['name'])

    return role.name!
  }

  changeUserRole(userId: number, teamId: number, roleName: string) {
    throw new FeatureNotAvailableError(this.edition)
  }

  async listTeamMembers(teamId: number) {
    const table = this.membersTable
    return this.knex
      .from(function(this: Knex) {
        this.from(table)
          .where({ team: teamId })
          .as('m')
      })
      .leftJoin(this.knex(this.usersTable).as('u'), 'm.user', 'u.id')
      .leftJoin(this.knex(this.rolesTable).as('r'), 'm.role', 'r.id')
      .select(
        'u.id',
        this.knex.raw('r.name as role'),
        'u.username',
        'u.picture',
        'u.email',
        'u.firstname',
        'u.lastname',
        'm.updated_at'
      )
      .then<Array<AuthUser & { role: string; updated_at: string }>>(res => res)
      .map(x => ({
        ...x,
        updated_at: undefined,
        fullName: [x.firstname, x.lastname].filter(Boolean).join(' ')
      }))
  }

  async assertUserMember(userId: number, teamId: number) {
    const member = await this.getMembership({ user: userId, team: teamId }, ['id'])

    if (!member) {
      throw new UnauthorizedAccessError('Not a member of this team')
    }
  }

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
  }

  async assertIsRootAdmin(userId: number) {
    if (userId !== this.ROOT_ADMIN_ID) {
      throw new UnauthorizedAccessError(`Only root admin is allowed to use this`)
    }
  }

  protected async getRole(where: {}, select?: Array<keyof AuthRole>) {
    return this.knex(this.rolesTable)
      .select(select || ['*'])
      .where(where)
      .limit(1)
      .then<Partial<AuthRoleDb>[]>(res => res)
      .get(0)
  }

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
  }
}
