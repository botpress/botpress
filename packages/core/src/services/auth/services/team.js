import _ from 'lodash'
import nanoid from 'nanoid'
import moment from 'moment'
import { checkRule } from '@botpress/util-roles'

import { UnauthorizedAccessError, InvalidOperationError } from '~/errors'

//const debug = require('debug')('svc:team')

export default ({ db }) => {
  const defaultRoles = require('../../config/default-roles.json')

  async function createNewTeam({ userId, name = 'Default Team' }) {
    const team = await db.models.team.create({
      name,
      inviteCode: nanoid()
    })

    const teamId = team.get('id')

    if (_.isArray(defaultRoles) && defaultRoles.length) {
      await db.models.role.bulkCreate(
        defaultRoles.map(role => {
          return { ...role, teamId }
        })
      )
    }

    await db.models.member.create({
      userId,
      teamId,
      role: 'owner'
    })

    return team.toJSON()
  }

  async function listUserTeams(userId) {
    const user = await db.models.user.findById(userId)
    const teams = await user.getTeams({ joinTableAttributes: ['role'] })
    return teams.map(t => t.toJSON()).map(x => {
      return { ..._.omit(x, ['member']), role: x.member.role }
    })
  }

  async function assertUserMember(userId, teamId) {
    const isMember = !!(await db.models.member.findOne({
      where: { userId, teamId }
    }))
    if (!isMember) {
      throw new UnauthorizedAccessError('Not a member of this team')
    }
  }

  async function getUserRole(userId, teamId) {
    const member = await db.models.member.findOne({
      where: { userId, teamId }
    })

    if (!member) {
      throw new UnauthorizedAccessError('Not a member of this team')
    }

    return member.role
  }

  async function getUserPermissions(userId, teamId) {
    const roleName = await getUserRole(userId, teamId)
    const role = await db.models.role.findOne({
      where: { teamId, name: roleName }
    })

    return (role && role.get('rules')) || []
  }

  async function listTeamMembers(teamId) {
    const team = await db.models.team.findOne({ where: { id: teamId } })
    return team.getMembers().map(x => {
      return {
        ..._.pick(x, ['id', 'username', 'picture', 'email']),
        fullName: x.get('fullName'),
        joinedAt: x.member.updatedAt,
        role: x.member.role
      }
    })
  }

  async function assertUserPermission(userId, teamId, resource, operation) {
    const permissions = await getUserPermissions(userId, teamId)

    if (!checkRule(permissions, operation, resource)) {
      throw new UnauthorizedAccessError('User does not have permission to perform this operation')
    }
  }

  async function assertUserRole(userId, teamId, roleName) {
    const isMember = !!(await db.models.member.findOne({
      where: { userId, teamId, role: roleName }
    }))
    if (!isMember) {
      throw new UnauthorizedAccessError(`User does not have role ${roleName} in the team`)
    }
  }

  async function listTeamRoles(teamId) {
    const team = await db.models.team.findOne({ where: { id: teamId } })
    return team.getRoles().map(x => _.pick(x, ['name', 'description', 'rules', 'createdAt', 'updatedAt', 'id']))
  }

  function createTeamRole(teamId, role) {
    role = _.pick(role, 'name', 'description', 'rules')
    return db.models.role.create({ ...role, teamId })
  }

  async function updateTeamRole(teamId, roleId, role) {
    const dbRole = await db.models.role.findOne({ where: { id: roleId }, attributes: ['name'] })

    if (dbRole.get('name') === 'owner') {
      throw new InvalidOperationError("You can't edit the owner role")
    }

    role = _.pick(role, 'description', 'rules')
    return db.models.role.update(role, { where: { teamId, id: roleId } })
  }

  async function deleteTeamRole(teamId, roleId) {
    const role = await db.models.role.findOne({ where: { id: roleId }, attributes: ['name'] })

    if (role.get('name') === 'owner') {
      throw new InvalidOperationError("You can't delete the owner role")
    }
    return db.models.role.destroy({ where: { teamId, id: roleId } })
  }

  async function assertUserNotMember(userId, teamId) {
    const isMember = !!(await db.models.member.findOne({
      where: { userId, teamId }
    }))
    if (isMember) {
      throw new InvalidOperationError('User is already part of the team')
    }
  }

  async function assertRoleExists(teamId, role) {
    const exists = !!(await db.models.role.findOne({
      where: { teamId, name: role }
    }))

    if (!exists) {
      throw new InvalidOperationError(`Role "${role}" doesn't exist`)
    }
  }

  async function addMemberToTeam(userId, teamId, role) {
    await db.models.member.create({ userId, teamId, role })
  }

  async function removeMemberFromTeam(userId, teamId) {
    await db.models.member.destroy({ where: { userId, teamId } })
  }

  function changeUserRole(userId, teamId, role) {
    return db.models.member.update({ role }, { where: { userId, teamId } })
  }

  async function deleteTeam(teamId) {
    await db.models.team.destroy({ where: { id: teamId } })
  }

  async function addUnpairedBot(teamId) {
    const bot = {
      teamId: teamId,
      paired: false,
      pairingToken: nanoid(24),
      publicId: nanoid(8)
    }

    // Allow a maximum of one unpaired bot at a time
    await db.models.bot.destroy({ where: { teamId, paired: false } })

    await db.models.bot.create(bot)

    return bot
  }

  async function listBots(teamId, offset = 0, limit = 100) {
    const { count, rows } = await db.models.bot.findAndCountAll({
      where: { teamId, paired: true },
      offset,
      limit,
      include: [db.models.botenv]
    })

    const mapEnv = env => {
      const obj = _.pick(env, ['name', 'botUrl', 'lastStartedAt', 'createdAt', 'updatedAt'])
      obj.recentlyActive = moment(obj.updatedAt).isAfter(moment().subtract(1, 'hours'))
      return obj
    }

    const bots = rows
      .map(r => _.pick(r.toJSON(), ['name', 'id', 'description', 'pairedAt', 'createdAt', 'botenvs']))
      .map(r => {
        return { ..._.omit(r, ['botenvs']), envs: r.botenvs.map(mapEnv) }
      })

    return { count, bots: bots }
  }

  async function deleteBot(teamId, botId) {
    await db.models.bot.destroy({ where: { teamId, id: botId } })
  }

  async function getInviteCode(teamId) {
    const team = await db.models.team.findOne({ where: { id: teamId } })
    return {
      inviteCode: team.inviteCode
    }
  }

  async function refreshInviteCode(teamId) {
    const team = await db.models.team.findOne({ where: { id: teamId } })

    Object.assign(team, {
      inviteCode: nanoid()
    })

    await team.save()

    return {
      inviteCode: team.inviteCode
    }
  }

  async function joinTeamFromInviteCode(userId, code) {
    const team = await db.models.team.findOne({ where: { inviteCode: code } })
    return addMemberToTeam(userId, team.id, 'default')
  }

  return {
    createNewTeam,
    listUserTeams,
    assertUserMember,
    listTeamMembers,
    listTeamRoles,
    assertUserNotMember,
    assertRoleExists,
    addMemberToTeam,
    getInviteCode,
    refreshInviteCode,
    joinTeamFromInviteCode,
    removeMemberFromTeam,
    changeUserRole,
    deleteTeam,
    assertUserRole,
    assertUserPermission,
    addUnpairedBot,
    listBots,
    deleteBot,
    getUserRole,
    getUserPermissions,
    createTeamRole,
    updateTeamRole,
    deleteTeamRole
  }
}
