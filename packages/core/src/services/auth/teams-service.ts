import { checkRule } from '@botpress/util-roles'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import nanoid from 'nanoid'

import { ExtendedKnex } from '../../database/interfaces'
import { AuthRole, AuthRule, AuthTeam, AuthTeamMembership, AuthUser, Bot, Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import { InvalidOperationError, UnauthorizedAccessError } from '../auth/errors'

import defaultRoles from './default-roles'

const TEAMS_TABLE = 'auth_teams'
const MEMBERS_TABLE = 'auth_team_members'
const ROLES_TABLE = 'auth_roles'
const USERS_TABLE = 'auth_users'
const BOTS_TABLE = 'srv_bots'

@injectable()
export default class TeamService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Auth Teams')
    private logger: Logger,
    @inject(TYPES.Database) private knex: ExtendedKnex
  ) {}

  async createNewTeam({ userId, name = 'Default Team' }: { userId: number; name?: string }) {
    const teamId = await this.knex.insertAndRetrieve<number>(TEAMS_TABLE, {
      name,
      inviteCode: nanoid()
    })

    if (_.isArray(defaultRoles) && defaultRoles.length) {
      await this.knex.batchInsert(
        TEAMS_TABLE,
        defaultRoles.map(role => {
          return { ...role, teamId }
        })
      )
    }

    await this.knex(TEAMS_TABLE).insert({
      user: userId,
      team: teamId,
      role: 'owner'
    })

    return teamId
  }

  async listUserTeams(userId: number) {
    return this.knex
      .from(function(this: ExtendedKnex) {
        this.from(MEMBERS_TABLE)
          .where({ user: userId })
          .as('m')
      })
      .leftJoin(this.knex(TEAMS_TABLE).as('t'), `${MEMBERS_TABLE}.team`, `${TEAMS_TABLE}.id`)
      .select(this.knex.raw('m.user as userId'), this.knex.raw('m.team as teamId'), 'm.role', 't.name')
      .then()
  }

  async assertUserMember(userId: number, teamId: number) {
    const member = await this.getMembership({ user: userId, team: teamId }, ['id'])

    if (!member) {
      throw new UnauthorizedAccessError('Not a member of this team')
    }
  }

  async getUserRole(userId: number, teamId: number) {
    const member = await this.getMembership({ user: userId, team: teamId }, ['role'])

    if (!member) {
      throw new UnauthorizedAccessError('Not a member of this team')
    }

    const role = await this.getRole({ team: teamId, id: member.role! }, ['name'])

    return role.name!
  }

  async getUserPermissions(userId: number, teamId: number) {
    const roleName = await this.getUserRole(userId, teamId)

    const role = await this.getRole({ team: teamId, name: roleName }, ['rules'])

    return (role && role.rules) || []
  }

  async listTeamMembers(teamId: number) {
    return this.knex
      .from(function(this: ExtendedKnex) {
        this.from(MEMBERS_TABLE)
          .where({ team: teamId })
          .as('m')
      })
      .leftJoin(this.knex(USERS_TABLE).as('u'), `${MEMBERS_TABLE}.user`, `${USERS_TABLE}.id`)
      .select('u.id', 'm.role', 'u.username', 'u.picture', 'u.email', 'u.firstname', 'u.lastname', 'm.updated_at')
      .then<Array<AuthUser & { role: string; updated_at: string }>>(res => res)
      .map(x => ({
        ...x,
        updated_at: undefined,
        fullName: `${x.firstname} ${x.lastname}`
      }))
  }

  async assertUserPermission(userId: number, teamId: number, resource: string, operation: string) {
    const permissions = await this.getUserPermissions(userId, teamId)

    if (!checkRule(permissions, operation, resource)) {
      throw new UnauthorizedAccessError('User does not have permission to perform this operation')
    }
  }

  async getMembership(where: {}, select?: Array<keyof AuthTeamMembership>) {
    return this.knex(MEMBERS_TABLE)
      .select(select || ['*'])
      .where(where)
      .limit(1)
      .then<Partial<AuthTeamMembership>[]>(res => res)
      .get(0)
  }

  async getTeam(where: {}, select?: Array<keyof AuthTeam>) {
    return this.knex(TEAMS_TABLE)
      .select(select || ['*'])
      .where(where)
      .limit(1)
      .then<Partial<AuthTeam>[]>(res => res)
      .get(0)
  }

  async assertUserRole(userId: number, teamId: number, roleName: string) {
    const isMember = this.getMembership({ user: userId, team: teamId, role: roleName }, ['role'])

    if (!isMember) {
      throw new UnauthorizedAccessError(`User does not have role ${roleName} in the team`)
    }
  }

  async listTeamRoles(teamId: number) {
    return this.knex(ROLES_TABLE)
      .select('id', 'name', 'description', 'rules', 'created_at', 'updated_at')
      .where({ team: teamId })
      .then<Array<AuthRole & { rules: string }>>(res => res)
      .map(
        r =>
          ({
            ...r,
            rules: JSON.parse(r.rules) as Array<AuthRule>
          } as AuthRole)
      )
  }

  async createTeamRole(teamId: number, role: AuthRole) {
    return this.knex(ROLES_TABLE)
      .insert({ ..._.pick(role, 'name', 'description', 'rules'), team: teamId })
      .then()
  }

  async updateTeamRole(teamId: number, roleId: number, role: AuthRole) {
    const dbRole = await this.knex(ROLES_TABLE)
      .select('name')
      .where({ id: roleId, team: teamId })
      .then<AuthRole[]>(res => res)
      .get(0)

    if (!dbRole) {
      throw new InvalidOperationError(`Unknown role ID ${roleId} for team ${teamId}`)
    }

    if (dbRole.name === 'owner') {
      throw new InvalidOperationError("You can't edit the owner role")
    }

    return this.knex(ROLES_TABLE)
      .where('id', roleId)
      .update(_.pick(role, 'description', 'rules'))
      .then()
  }

  async deleteTeamRole(teamId: number, roleId: number) {
    const dbRole = await this.knex(ROLES_TABLE)
      .select('name')
      .where({ id: roleId, team: teamId })
      .then<AuthRole[]>(res => res)
      .get(0)

    if (!dbRole) {
      throw new InvalidOperationError(`Unknown role ID ${roleId} for team ${teamId}`)
    }

    if (dbRole.name === 'owner') {
      throw new InvalidOperationError("You can't delete the owner role")
    }

    return this.knex(ROLES_TABLE)
      .where('id', roleId)
      .delete()
      .then()
  }

  async assertUserNotMember(userId: number, teamId: number) {
    const member = this.getMembership({ user: userId, team: teamId }, ['id'])

    if (member) {
      throw new InvalidOperationError('User is already part of the team')
    }
  }

  async getRole(where: {}, select?: Array<keyof AuthRole>) {
    return this.knex(ROLES_TABLE)
      .select(select || ['*'])
      .where(where)
      .limit(1)
      .then<Partial<AuthRole>[]>(res => res)
      .get(0)
  }

  async assertRoleExists(teamId: number, roleName: string) {
    const role = await this.getRole({ team: teamId, name: roleName }, ['id'])

    if (!role) {
      throw new InvalidOperationError(`Role "${roleName}" doesn't exist`)
    }
  }

  async addMemberToTeam(userId: number, teamId: number, roleName: string) {
    const role = await this.getRole({ team: teamId, name: roleName })
    return this.knex(MEMBERS_TABLE).insert({ user: userId, team: teamId, role: role.id })
  }

  async removeMemberFromTeam(userId, teamId) {
    return this.knex(MEMBERS_TABLE)
      .where({ user: userId, team: teamId })
      .delete()
  }

  async changeUserRole(userId: number, teamId: number, roleName: string) {
    const role = await this.getRole({ team: teamId, name: roleName })
    return this.knex(MEMBERS_TABLE)
      .where({ user: userId, team: teamId })
      .update({ role: role.id })
      .then()
  }

  async deleteTeam(teamId: number) {
    return this.knex(TEAMS_TABLE)
      .where('id', teamId)
      .delete()
      .then()
  }

  async addBot(teamId: number) {
    const id = nanoid(8)
    const bot: Partial<Bot> = {
      team: teamId,
      name: `Bot ${id}`,
      public_id: id
    }

    await this.knex(BOTS_TABLE)
      .insert(bot)
      .then()

    return bot
  }

  async listBots(teamId: number, offset: number = 0, limit: number = 100) {
    const bots = await this.knex(BOTS_TABLE)
      .where({ team: teamId })
      .offset(offset)
      .limit(limit)
      .select('id', 'name', 'description', 'created_at')
      .then<Array<Bot>>(res => res)

    return { count: bots.length, bots }
  }

  async deleteBot(teamId, botId) {
    await this.knex(BOTS_TABLE)
      .where({ team: teamId, id: botId })
      .delete()
  }

  async getInviteCode(teamId) {
    const team = await this.getTeam({ id: teamId }, ['invite_code'])

    return {
      inviteCode: team.invite_code
    }
  }

  async refreshInviteCode(teamId: number) {
    const inviteCode = nanoid()

    await this.knex(TEAMS_TABLE)
      .where('id', teamId)
      .update({
        invite_code: inviteCode
      })
      .then()

    return {
      inviteCode
    }
  }

  async joinTeamFromInviteCode(userId: number, code: string) {
    const team = await this.getTeam({ invite_code: code }, ['id'])
    return this.addMemberToTeam(userId, team.id!, 'default')
  }
}
