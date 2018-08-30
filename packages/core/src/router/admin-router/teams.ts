import Joi from 'joi'
import _ from 'lodash'

import { Logger } from '../../misc/interfaces'
import AuthService from '../../services/auth/auth-service'
import { InvalidOperationError } from '../../services/auth/errors'
import TeamsService from '../../services/auth/teams-service'
import { BaseRouter } from '../base-router'

import { asyncMiddleware, success as sendSuccess, validateBodySchema } from './util'

export class TeamsRouter extends BaseRouter {
  private asyncMiddleware!: Function

  constructor(logger: Logger, private authService: AuthService, private teamsService: TeamsService) {
    super()
    this.asyncMiddleware = asyncMiddleware({ logger })

    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router
    const svc = this.teamsService

    router.post(
      '/', // Create team
      this.asyncMiddleware(async (req, res) => {
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

        const name = req.body.name
        const teamId = await svc.createNewTeam({ userId: req.dbUser.id, name })

        return sendSuccess(res, 'Team created successfully', {
          name,
          teamId
        })
      })
    )

    router.get(
      '/', // List teams
      this.asyncMiddleware(async (req, res) => {
        const teams = await svc.listUserTeams(req.dbUser.id)
        return sendSuccess(res, 'Retrieved teams', teams)
      })
    )

    router.get(
      '/:teamId/members', // List team members
      this.asyncMiddleware(async (req, res) => {
        await svc.assertUserMember(req.dbUser.id, req.params.teamId)
        await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.members', 'read')
        const teams = await svc.listTeamMembers(req.params.teamId)
        return sendSuccess(res, 'Retrieved team members', teams)
      })
    )

    router.get(
      '/:teamId/invite', // Get invite code
      this.asyncMiddleware(async (req, res) => {
        await svc.assertUserMember(req.dbUser.id, req.params.teamId)
        await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.members', 'write')
        const code = await svc.getInviteCode(req.params.teamId)
        return sendSuccess(res, 'Retrieved team invite code', code)
      })
    )

    router.post(
      '/:teamId/invite', // Refresh invite code
      this.asyncMiddleware(async (req, res) => {
        await svc.assertUserMember(req.dbUser.id, req.params.teamId)
        await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.members', 'write')
        const code = await svc.refreshInviteCode(req.params.teamId)
        return sendSuccess(res, 'Refreshed team invite code', code)
      })
    )

    router.post(
      '/join', // Refresh invite code
      this.asyncMiddleware(async (req, res) => {
        validateBodySchema(
          req,
          Joi.object().keys({
            code: Joi.string()
              .trim()
              .required()
          })
        )

        const team = await svc.joinTeamFromInviteCode(req.dbUser.id, req.body.code)
        return sendSuccess(res, 'Joined team successfully', team)
      })
    )

    router.get(
      '/:teamId/roles', // List team roles
      this.asyncMiddleware(async (req, res) => {
        await svc.assertUserMember(req.dbUser.id, req.params.teamId)
        await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.roles', 'read')
        const roles = await svc.listTeamRoles(req.params.teamId)
        return sendSuccess(res, 'Retrieved team roles', roles)
      })
    )

    router.post(
      '/:teamId/roles', // Add team role
      this.asyncMiddleware(async (req, res) => {
        await svc.assertUserMember(req.dbUser.id, req.params.teamId)
        await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.roles', 'write')
        await svc.createTeamRole(req.params.teamId, req.body)
        return sendSuccess(res, 'Created team role')
      })
    )

    router.patch(
      '/:teamId/roles/:roleId', // Edit team role
      this.asyncMiddleware(async (req, res) => {
        await svc.assertUserMember(req.dbUser.id, req.params.teamId)
        await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.roles', 'write')
        await svc.updateTeamRole(req.params.teamId, req.params.roleId, req.body)
        return sendSuccess(res, 'Updated team role')
      })
    )

    router.delete(
      '/:teamId/roles/:roleId', // Delete team role
      this.asyncMiddleware(async (req, res) => {
        await svc.assertUserMember(req.dbUser.id, req.params.teamId)
        await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.roles', 'write')
        await svc.deleteTeamRole(req.params.teamId, req.params.roleId)
        return sendSuccess(res, 'Deleted team role')
      })
    )

    router.post(
      '/:teamId/members/:username', // Add team member
      this.asyncMiddleware(async (req, res) => {
        validateBodySchema(
          req,
          Joi.object().keys({
            role: Joi.string().required()
          })
        )

        await svc.assertUserMember(req.dbUser.id, req.params.teamId)
        await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.members', 'write')
        await svc.assertRoleExists(req.params.teamId, req.body.role)
        const user = await this.authService.findUserByUsername(req.params.username)
        await svc.assertUserNotMember(user!.id, req.params.teamId)
        await svc.addMemberToTeam(user!.id, req.params.teamId, req.body.role)

        return sendSuccess(res, 'Added team member', {})
      })
    )

    router.delete(
      '/:teamId/members/:username', // Remove team member
      this.asyncMiddleware(async (req, res) => {
        await svc.assertUserMember(req.dbUser.id, req.params.teamId)
        await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.members', 'write')
        const user = await this.authService.findUserByUsername(req.params.username, ['id'])
        const userId = user!.id
        await svc.assertUserMember(userId, req.params.teamId)

        const role = await svc.getUserRole(userId, req.params.teamId)
        if (role === 'owner') {
          throw new InvalidOperationError("You can't remove the owner of the team")
        }

        await svc.removeMemberFromTeam(userId, req.params.teamId)

        return sendSuccess(res, 'Removed team member', {})
      })
    )

    router.patch(
      '/:teamId/members/:username', // Change member role
      this.asyncMiddleware(async (req, res) => {
        validateBodySchema(
          req,
          Joi.object().keys({
            role: Joi.string().required()
          })
        )

        await svc.assertUserMember(req.dbUser.id, req.params.teamId)
        await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.members', 'write')
        const user = await this.authService.findUserByUsername(req.params.username, ['id'])
        const userId = user!.id
        await svc.assertUserMember(userId, req.params.teamId)
        await svc.assertRoleExists(req.params.teamId, req.body.role)
        await svc.changeUserRole(userId, req.params.teamId, req.body.role)

        return sendSuccess(res, 'Updated team member', {})
      })
    )

    router.delete(
      '/:teamId', // Delete team
      this.asyncMiddleware(async (req, res) => {
        await svc.assertUserMember(req.dbUser.id, req.params.teamId)
        await svc.assertUserRole(req.dbUser.id, req.params.teamId, 'owner')
        await svc.deleteTeam(req.params.teamId)

        return sendSuccess(res, 'Team deleted', {
          teamId: req.params.teamId
        })
      })
    )

    router.post(
      '/:teamId/bots', // Add new bot
      this.asyncMiddleware(async (req, res) => {
        await svc.assertUserMember(req.dbUser.id, req.params.teamId)
        await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.bots', 'write')
        const bot = await svc.addBot(req.params.teamId)

        return sendSuccess(res, 'Added new bot', {
          botId: bot.id,
          teamId: req.params.teamId
        })
      })
    )

    router.get(
      '/:teamId/bots', // List bots
      this.asyncMiddleware(async (req, res) => {
        await svc.assertUserMember(req.dbUser.id, req.params.teamId)
        await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.bots', 'read')

        const offset = _.get(req, 'query.offset') || 0

        const { count, bots } = await svc.listBots(req.params.teamId, offset, 100)
        return sendSuccess(res, 'Retrieved team bots', { count, bots })
      })
    )

    router.delete(
      '/:teamId/bots/:botId', // Delete a bot
      this.asyncMiddleware(async (req, res) => {
        await svc.assertUserMember(req.dbUser.id, req.params.teamId)
        await svc.assertUserPermission(req.dbUser.id, req.params.teamId, 'cloud.team.bots', 'write')
        await svc.deleteBot(req.params.teamId, req.params.botId)

        return sendSuccess(res, 'Removed bot from team', { botId: req.params.botId })
      })
    )
  }
}
