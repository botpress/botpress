import { Logger } from 'botpress/sdk'
import AuthService from 'core/services/auth/auth-service'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'
import Joi from 'joi'
import _ from 'lodash'

import { CustomRouter } from '../customRouter'
import { ConflictError } from '../errors'
import {
  assertBotpressPro,
  assertSuperAdmin,
  needPermissions,
  success as sendSuccess,
  validateBodySchema
} from '../util'

export class UsersRouter extends CustomRouter {
  private readonly resource = 'admin.users'
  private needPermissions: (operation: string, resource: string) => RequestHandler
  private assertBotpressPro: RequestHandler

  constructor(logger: Logger, private authService: AuthService, private workspaceService: WorkspaceService) {
    super('Users', logger, Router({ mergeParams: true }))
    this.needPermissions = needPermissions(this.workspaceService)
    this.assertBotpressPro = assertBotpressPro(this.workspaceService)
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const users = await this.workspaceService.getWorkspaceUsersAttributes(req.workspace!, ['last_logon'])
        return sendSuccess(res, 'Retrieved users', users)
      })
    )

    router.get(
      '/listAvailableUsers',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const allUsers = await this.authService.getAllUsers()
        const workspaceUsers = await this.workspaceService.getWorkspaceUsers(req.workspace!)

        return sendSuccess(res, 'Retrieved users', _.filter(allUsers, x => !_.find(workspaceUsers, x)))
      })
    )

    router.post(
      '/workspace/add',
      this.assertBotpressPro,
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { email, strategy, role } = req.body

        const workspaceUsers = await this.workspaceService.getWorkspaceUsers(req.workspace!)
        if (workspaceUsers.find(x => x.email === email && x.strategy === strategy)) {
          throw new ConflictError(`User "${email}" is already a member of this workspace`)
        }

        await this.workspaceService.addUserToWorkspace(email, strategy, req.workspace!, role)

        res.sendStatus(200)
      })
    )

    router.delete(
      '/workspace/remove/:strategy/:email',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { email, strategy } = req.params

        if (req.authUser!.email === email) {
          return res.status(400).json({ message: "Sorry, you can't delete your own account." })
        }

        await this.workspaceService.removeUserFromWorkspace(email, strategy, req.workspace!)
        return sendSuccess(res, 'User removed', { email })
      })
    )

    router.put(
      '/workspace/update_role',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { email, strategy, role } = req.body

        await this.workspaceService.updateUserRole(email, strategy, req.workspace!, role)
        return sendSuccess(res, 'User updated')
      })
    )

    router.post(
      '/',
      this.assertBotpressPro,
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        validateBodySchema(
          req,
          Joi.object().keys({
            email: Joi.string()
              .trim()
              .required(),
            role: Joi.string().required(),
            strategy: Joi.string().required()
          })
        )
        const { email, strategy, role } = req.body
        const alreadyExists = await this.authService.findUser(email, strategy)

        if (alreadyExists) {
          throw new ConflictError(`User "${email}" is already taken`)
        }

        const result = await this.authService.createUser({ email, strategy }, strategy)
        await this.workspaceService.addUserToWorkspace(email, strategy, req.workspace!, role)

        return sendSuccess(res, 'User created successfully', {
          email,
          tempPassword: typeof result === 'string' ? result : `(Use ${strategy} password)`
        })
      })
    )

    router.delete(
      '/:strategy/:email',
      assertSuperAdmin,
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { email, strategy } = req.params

        if (req.authUser!.email === email) {
          return res.status(400).json({ message: "Sorry, you can't delete your own account." })
        }

        await this.workspaceService.removeUserFromAllWorkspaces(email, strategy)
        await this.authService.deleteUser(email, strategy)

        return sendSuccess(res, 'User deleted', { email })
      })
    )

    router.get(
      '/reset/:strategy/:email',
      assertSuperAdmin,
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { email, strategy } = req.params

        const tempPassword = await this.authService.resetPassword(email, strategy)

        return sendSuccess(res, 'Password reseted', {
          tempPassword
        })
      })
    )
  }
}
