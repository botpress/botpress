import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import { WorkspaceUser, WorkspaceUserWithAttributes } from 'botpress/sdk'
import { ConflictError, InvalidOperationError, sendSuccess, validateBodySchema, BadRequestError } from 'core/routers'
import { assertSuperAdmin } from 'core/security'

import Joi from 'joi'
import _ from 'lodash'

class CollaboratorsRouter extends CustomAdminRouter {
  private readonly resource = 'admin.collaborators'

  constructor(services: AdminServices) {
    super('Collaborators', services)
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
        const filterRoles = req.query.roles?.split(',') || []
        const filterAuthStrategies = (await this.workspaceService.findWorkspace(req.workspace!)).authStrategies || []

        // When adding a collaborator, we do not use the roles filter since the user may not be in any workspace yet
        if (!filterRoles.length) {
          const allUsers = await this.authService.getAllUsers()
          const allUsersMatchingStrategy = allUsers.filter(x => filterAuthStrategies.includes(x.strategy))
          const workspaceUsers = await this.workspaceService.getWorkspaceUsers(req.workspace!)
          const available = _.filter(allUsersMatchingStrategy, x => !_.find(workspaceUsers, x)) as WorkspaceUser[]

          return sendSuccess(res, 'Retrieved available users', available)
        }

        // Get all users from other workspaces
        let workspaceUsers: WorkspaceUser[] | WorkspaceUserWithAttributes[] = []
        for (const w of await this.workspaceService.getWorkspaces()) {
          if (w.id !== req.workspace) {
            const users = await this.workspaceService.getWorkspaceUsers(w.id)
            workspaceUsers = [...workspaceUsers, ...users]
          }
        }

        // filter on roles and auth strategies
        const available = workspaceUsers
          .filter(u => (filterAuthStrategies.length ? filterAuthStrategies.includes(u.strategy) : true))
          .filter(u => (filterRoles.length ? filterRoles.includes(u.role) : true))
        return sendSuccess(res, 'Retrieved available users', available)
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

export default CollaboratorsRouter
