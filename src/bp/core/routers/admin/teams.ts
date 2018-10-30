import { Logger } from 'botpress/sdk'
import { AdminService } from 'core/services/admin/service'
import { Router } from 'express'
import Joi from 'joi'
import _ from 'lodash'

import { CustomRouter } from '..'
import { Bot } from '../../misc/interfaces'
import AuthService from '../../services/auth/auth-service'
import { InvalidOperationError } from '../../services/auth/errors'
import { asyncMiddleware, error as sendError, success as sendSuccess, validateBodySchema } from '../util'

export class TeamsRouter implements CustomRouter {
  private asyncMiddleware!: Function
  public readonly router: Router

  constructor(logger: Logger, private authService: AuthService, private adminService: AdminService) {
    this.asyncMiddleware = asyncMiddleware({ logger })
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router
    const svc = this.adminService

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

        const userId = req.dbUser.id
        const name = req.body.name
        const teamId = await svc.createNewTeam({ userId, name })

        return sendSuccess(res, 'Team created successfully', {
          name,
          teamId
        })
      })
    )

    router.get(
      '/', // List teams
      this.asyncMiddleware(async (req, res) => {
        const userId = req.dbUser.id
        const teams = await svc.listUserTeams(userId)
        return sendSuccess(res, 'Retrieved teams', teams)
      })
    )

    router.get(
      '/bots',
      this.asyncMiddleware(async (req, res) => {
        const userId = req.dbUser.id
        const teams = (await svc.listUserTeams(userId)) as any[]
        let bots: any[] = []
        for (const team of teams) {
          const { bots: teamBots } = await this.adminService.listBots(team.id)

          bots = [
            ...teamBots.map(x => ({
              ...x,
              team: team.name
            })),
            ...bots
          ]
        }

        return sendSuccess(res, 'Retrieved bots for all teams', bots)
      })
    )

    router.get(
      '/:teamId/members', // List team members
      this.asyncMiddleware(async (req, res) => {
        const { teamId } = req.params
        const userId = req.dbUser.id
        await svc.assertUserMember(userId, teamId)
        await svc.assertUserPermission(userId, teamId, 'admin.team.members', 'read')
        const teams = await svc.listTeamMembers(teamId)
        return sendSuccess(res, 'Retrieved team members', teams)
      })
    )

    router.get(
      '/:teamId/roles', // List team roles
      this.asyncMiddleware(async (req, res) => {
        const { teamId } = req.params
        const userId = req.dbUser.id
        await svc.assertUserMember(userId, teamId)
        await svc.assertUserPermission(userId, teamId, 'admin.team.roles', 'read')
        const roles = await svc.listTeamRoles(teamId)
        return sendSuccess(res, 'Retrieved team roles', roles)
      })
    )

    router.post(
      '/:teamId/roles', // Add team role
      this.asyncMiddleware(async (req, res) => {
        const { teamId } = req.params
        const userId = req.dbUser.id
        await svc.assertUserMember(userId, teamId)
        await svc.assertUserPermission(userId, teamId, 'admin.team.roles', 'write')
        await svc.createTeamRole(teamId, req.body)
        return sendSuccess(res, 'Created team role')
      })
    )

    router.patch(
      '/:teamId/roles/:roleId', // Edit team role
      this.asyncMiddleware(async (req, res) => {
        const { teamId } = req.params
        const userId = req.dbUser.id
        await svc.assertUserMember(userId, teamId)
        await svc.assertUserPermission(userId, teamId, 'admin.team.roles', 'write')
        await svc.updateTeamRole(teamId, req.params.roleId, req.body)
        return sendSuccess(res, 'Updated team role')
      })
    )

    router.delete(
      '/:teamId/roles/:roleId', // Delete team role
      this.asyncMiddleware(async (req, res) => {
        const { teamId } = req.params
        const userId = req.dbUser.id
        await svc.assertUserMember(userId, teamId)
        await svc.assertUserPermission(userId, teamId, 'admin.team.roles', 'write')
        await svc.deleteTeamRole(teamId, req.params.roleId)
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

        const { teamId } = req.params
        const userId = req.dbUser.id
        await svc.assertUserMember(userId, teamId)
        await svc.assertUserPermission(userId, teamId, 'admin.team.members', 'write')
        await svc.assertRoleExists(teamId, req.body.role)
        const user = await this.authService.findUserByUsername(req.params.username)
        await svc.assertUserNotMember(user!.id, teamId)
        await svc.addMemberToTeam(user!.id, teamId, req.body.role)

        return sendSuccess(res, 'Added team member', {})
      })
    )

    router.delete(
      '/:teamId/members/:username', // Remove team member
      this.asyncMiddleware(async (req, res) => {
        const currentUserId = req.dbUser.id
        const { teamId } = req.params
        await svc.assertUserMember(currentUserId, teamId)
        await svc.assertUserPermission(currentUserId, teamId, 'admin.team.members', 'write')
        const user = await this.authService.findUserByUsername(req.params.username, ['id'])
        const userId = user!.id
        await svc.assertUserMember(userId, teamId)

        const role = await svc.getUserRole(userId, teamId)
        if (role === 'owner') {
          throw new InvalidOperationError("You can't remove the owner of the team")
        }

        await svc.removeMemberFromTeam(userId, teamId)

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

        const { teamId } = req.params
        const currentUserId = req.dbUser.id
        await svc.assertUserMember(currentUserId, teamId)
        await svc.assertUserPermission(currentUserId, teamId, 'admin.team.members', 'write')
        const user = await this.authService.findUserByUsername(req.params.username, ['id'])
        const userId = user!.id
        await svc.assertUserMember(userId, teamId)
        await svc.assertRoleExists(teamId, req.body.role)
        await svc.changeUserRole(userId, teamId, req.body.role)

        return sendSuccess(res, 'Updated team member', {})
      })
    )

    router.delete(
      '/:teamId', // Delete team
      this.asyncMiddleware(async (req, res) => {
        const { teamId } = req.params
        const userId = req.dbUser.id
        await svc.assertUserMember(userId, teamId)
        await svc.assertUserRole(userId, teamId, 'owner')
        await svc.deleteTeam(teamId)

        return sendSuccess(res, 'Team deleted', {
          teamId: teamId
        })
      })
    )

    router.post(
      '/:teamId/bots', // Add new bot
      this.asyncMiddleware(async (req, res) => {
        const { teamId } = req.params
        const bot = <Bot>req.body
        const userId = req.dbUser.id
        await svc.assertUserMember(userId, teamId)
        await svc.assertUserPermission(userId, teamId, 'admin.team.bots', 'write')
        try {
          await svc.addBot(teamId, bot)
        } catch (err) {
          return sendError(res, 400, undefined, err.message)
        }

        return sendSuccess(res, 'Added new bot', {
          botId: bot.id,
          teamId: teamId
        })
      })
    )

    router.get(
      '/:teamId/bots', // List bots
      this.asyncMiddleware(async (req, res) => {
        const { teamId } = req.params
        const userId = req.dbUser.id

        await svc.assertUserMember(userId, teamId)
        await svc.assertUserPermission(userId, teamId, 'admin.team.bots', 'read')

        const offset = _.get(req, 'query.offset') || 0

        const { count, bots } = await svc.listBots(teamId, offset, 100)
        return sendSuccess(res, 'Retrieved team bots', { count, bots })
      })
    )

    router.delete(
      '/:teamId/bots/:botId', // Delete a bot
      this.asyncMiddleware(async (req, res) => {
        const { botId, teamId } = req.params
        const userId = req.dbUser.id

        await svc.assertUserMember(userId, teamId)
        await svc.assertUserPermission(userId, teamId, 'admin.team.bots', 'write')
        await svc.deleteBot(teamId, botId)

        return sendSuccess(res, 'Removed bot from team', { botId })
      })
    )
  }
}
