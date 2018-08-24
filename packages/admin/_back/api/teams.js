import { Router } from 'express'
import Joi from 'joi'
import _ from 'lodash'

import { validateBodySchema } from './common/assert'
import { success, asyncMiddleware } from './common/reply'

import { InvalidOperationError } from '~/errors'

import TeamService from '~/services/team'
import UserService from '~/services/user'

export default ({ config, db }) => {
  const router = Router()
  const svc = TeamService({ config, db })
  const userSvc = UserService({ config, db })

  router.post(
    '/', // Create team
    asyncMiddleware(async (req, res) => {
      validateBodySchema(
        req,
        Joi.object().keys({
          name: Joi.string()
            .regex(/^[0-9A-Za-z _-]+$/)
            .trim()
            .min(3)
            .max(30)
            .required()
        })
      )

      const team = await svc.createNewTeam({ userId: req.dbUser.id, name: req.body.name })

      return success(res)('Team created successfully', {
        name: team.name,
        teamId: team.id
      })
    })
  )

  router.get(
    '/', // List teams
    asyncMiddleware(async (req, res) => {
      const teams = await svc.listUserTeams(req.dbUser.id)
      return success(res)('Retrieved teams', teams)
    })
  )

  router.get(
    '/:teamId/members', // List team members
    asyncMiddleware(async (req, res) => {
      await svc.assertUserMember(req.dbUser.id, req.params.teamId)
      await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.members', 'read')
      const teams = await svc.listTeamMembers(req.params.teamId)
      return success(res)('Retrieved team members', teams)
    })
  )

  router.get(
    '/:teamId/invite', // Get invite code
    asyncMiddleware(async (req, res) => {
      await svc.assertUserMember(req.dbUser.id, req.params.teamId)
      await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.members', 'write')
      const code = await svc.getInviteCode(req.params.teamId)
      return success(res)('Retrieved team invite code', code)
    })
  )

  router.post(
    '/:teamId/invite', // Refresh invite code
    asyncMiddleware(async (req, res) => {
      await svc.assertUserMember(req.dbUser.id, req.params.teamId)
      await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.members', 'write')
      const code = await svc.refreshInviteCode(req.params.teamId)
      return success(res)('Refreshed team invite code', code)
    })
  )

  router.post(
    '/join', // Refresh invite code
    asyncMiddleware(async (req, res) => {
      validateBodySchema(
        req,
        Joi.object().keys({
          code: Joi.string()
            .trim()
            .required()
        })
      )

      const team = await svc.joinTeamFromInviteCode(req.dbUser.id, req.body.code)
      return success(res)('Joined team successfully', team)
    })
  )

  router.get(
    '/:teamId/roles', // List team roles
    asyncMiddleware(async (req, res) => {
      await svc.assertUserMember(req.dbUser.id, req.params.teamId)
      await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.roles', 'read')
      const roles = await svc.listTeamRoles(req.params.teamId)
      return success(res)('Retrieved team roles', roles)
    })
  )

  router.post(
    '/:teamId/roles', // Add team role
    asyncMiddleware(async (req, res) => {
      await svc.assertUserMember(req.dbUser.id, req.params.teamId)
      await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.roles', 'write')
      await svc.createTeamRole(req.params.teamId, req.body)
      return success(res)('Created team role')
    })
  )

  router.patch(
    '/:teamId/roles/:roleId', // Edit team role
    asyncMiddleware(async (req, res) => {
      await svc.assertUserMember(req.dbUser.id, req.params.teamId)
      await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.roles', 'write')
      await svc.updateTeamRole(req.params.teamId, req.params.roleId, req.body)
      return success(res)('Updated team role')
    })
  )

  router.delete(
    '/:teamId/roles/:roleId', // Delete team role
    asyncMiddleware(async (req, res) => {
      await svc.assertUserMember(req.dbUser.id, req.params.teamId)
      await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.roles', 'write')
      await svc.deleteTeamRole(req.params.teamId, req.params.roleId)
      return success(res)('Deleted team role')
    })
  )

  router.post(
    '/:teamId/members/:username', // Add team member
    asyncMiddleware(async (req, res) => {
      validateBodySchema(
        req,
        Joi.object().keys({
          role: Joi.string().required()
        })
      )

      await svc.assertUserMember(req.dbUser.id, req.params.teamId)
      await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.members', 'write')
      await svc.assertRoleExists(req.params.teamId, req.body.role)
      const user = await userSvc.getUserByUsername(req.params.username)
      await svc.assertUserNotMember(user.id, req.params.teamId)
      await svc.addMemberToTeam(user.id, req.params.teamId, req.body.role)

      return success(res)('Added team member', {})
    })
  )

  router.delete(
    '/:teamId/members/:username', // Remove team member
    asyncMiddleware(async (req, res) => {
      await svc.assertUserMember(req.dbUser.id, req.params.teamId)
      await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.members', 'write')
      const user = await userSvc.getUserByUsername(req.params.username)
      await svc.assertUserMember(user.id, req.params.teamId)

      const role = await svc.getUserRole(user.id, req.params.teamId)
      if (role === 'owner') {
        throw new InvalidOperationError("You can't remove the owner of the team")
      }

      await svc.removeMemberFromTeam(user.id, req.params.teamId)

      return success(res)('Removed team member', {})
    })
  )

  router.patch(
    '/:teamId/members/:username', // Change member role
    asyncMiddleware(async (req, res) => {
      validateBodySchema(
        req,
        Joi.object().keys({
          role: Joi.string().required()
        })
      )

      await svc.assertUserMember(req.dbUser.id, req.params.teamId)
      await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.members', 'write')
      const user = await userSvc.getUserByUsername(req.params.username)
      await svc.assertUserMember(user.id, req.params.teamId)
      await svc.assertRoleExists(req.params.teamId, req.body.role)
      await svc.changeUserRole(user.id, req.params.teamId, req.body.role)

      return success(res)('Updated team member', {})
    })
  )

  router.delete(
    '/:teamId', // Delete team
    asyncMiddleware(async (req, res) => {
      await svc.assertUserMember(req.dbUser.id, req.params.teamId)
      await svc.assertUserRole(req.dbUser.id, req.params.teamId, 'owner')
      await svc.deleteTeam(req.params.teamId)

      return success(res)('Team deleted', {
        teamId: req.params.teamId
      })
    })
  )

  router.post(
    '/:teamId/bots', // Add unpaired bot
    asyncMiddleware(async (req, res) => {
      await svc.assertUserMember(req.dbUser.id, req.params.teamId)
      await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.bots', 'write')
      const bot = await svc.addUnpairedBot(req.params.teamId)

      return success(res)('Added a new unpaired bot', {
        pairingToken: bot.pairingToken,
        botId: bot.botId,
        teamId: req.params.teamId
      })
    })
  )

  router.get(
    '/:teamId/bots', // List bots
    asyncMiddleware(async (req, res) => {
      await svc.assertUserMember(req.dbUser.id, req.params.teamId)
      await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.bots', 'read')

      const offset = _.get(req, 'query.offset') || 0

      const { count, bots } = await svc.listBots(req.params.teamId, offset, 100)
      return success(res)('Retrieved team bots', { count, bots })
    })
  )

  router.delete(
    '/:teamId/bots/:botId', // Delete a bot
    asyncMiddleware(async (req, res) => {
      await svc.assertUserMember(req.dbUser.id, req.params.teamId)
      await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.bots', 'write')
      await svc.deleteBot(req.params.teamId, req.params.botId)

      return success(res)('Removed bot from team', { botId: req.params.botId })
    })
  )

  return router
}
