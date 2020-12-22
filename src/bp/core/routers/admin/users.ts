import { Logger, WorkspaceUser } from 'botpress/sdk'
import AuthService from 'core/services/auth/auth-service'
import { InvalidOperationError } from 'core/services/auth/errors'
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
  private readonly resource = 'admin.collaborators'
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

    // List of all users which are currently member of the active workspace
    router.get(
      '/',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const filterRoles = req.query.roles && req.query.roles.split(',')
        const attributes = ['last_logon', 'firstname', 'lastname', 'picture_url', 'created_at']
        const users = await this.workspaceService.getWorkspaceUsers(req.workspace!, { attributes })

        return sendSuccess(
          res,
          'Retrieved users',
          filterRoles ? users.filter(x => filterRoles.includes(x.role)) : users
        )
      })
    )

    // Returns the list of users NOT currently member of the active workspace
    router.get(
      '/listAvailableUsers',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const filterRoles = req.query.roles && req.query.roles.split(',')
        const allUsers = await this.authService.getAllUsers()
        const workspaceUsers = await this.workspaceService.getWorkspaceUsers(req.workspace!)
        const available = _.filter(allUsers, x => !_.find(workspaceUsers, x)) as WorkspaceUser[]

        return sendSuccess(
          res,
          'Retrieved available users',
          filterRoles ? available.filter(x => filterRoles.includes(x.role)) : available
        )
      })
    )

    router.post(
      '/workspace/add',
      this.assertBotpressPro,
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { strategy, role } = req.body

        const existingUser = await this.authService.findUser(req.body.email, strategy)
        if (!existingUser) {
          throw new InvalidOperationError("User doesn't exist")
        }

        const email = existingUser.email
        const workspaceUsers = await this.workspaceService.getWorkspaceUsers(req.workspace!)
        if (workspaceUsers.find(x => x.email.toLowerCase() === email.toLowerCase() && x.strategy === strategy)) {
          throw new ConflictError(`User "${email}" is already a member of this workspace`)
        }

        await this.workspaceService.addUserToWorkspace(email, strategy, req.workspace!, { role })

        res.sendStatus(200)
      })
    )

    router.post(
      '/workspace/remove/:strategy/:email/delete',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { email, strategy } = req.params

        if (req.authUser!.email.toLowerCase() === email.toLowerCase()) {
          return res.status(400).json({ message: "Sorry, you can't delete your own account." })
        }

        await this.workspaceService.removeUserFromWorkspace(email, strategy, req.workspace!)
        return sendSuccess(res, 'User removed', { email })
      })
    )

    router.post(
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
        await this.workspaceService.addUserToWorkspace(email, strategy, req.workspace!, { role })

        return sendSuccess(res, 'User created successfully', {
          email,
          tempPassword: typeof result === 'string' ? result : `(Use ${strategy} password)`
        })
      })
    )

    router.post(
      '/:strategy/:email/delete',
      assertSuperAdmin,
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const { email, strategy } = req.params

        if (req.authUser!.email.toLowerCase() === email.toLowerCase()) {
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

        return sendSuccess(res, 'Password reset', {
          tempPassword
        })
      })
    )
  }
}
