import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import { AuthRule, RequestWithUser, TokenUser, UserProfile } from 'common/typings'
import { NotFoundError, sendSuccess, validateBodySchema } from 'core/routers'
import { assertWorkspace } from 'core/security'
import Joi from 'joi'
import _ from 'lodash'

class UserRouter extends CustomAdminRouter {
  constructor(services: AdminServices) {
    super('User', services)
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/profile',
      this.checkTokenHeader,
      assertWorkspace,
      this.asyncMiddleware(async (req: RequestWithUser, res) => {
        const { email, strategy, isSuperAdmin } = req.tokenUser!
        const user = await this.authService.findUser(email, strategy)
        if (!user) {
          throw new NotFoundError(`User ${email || ''} not found`)
        }
        const { firstname, lastname, picture_url } = user.attributes
        const { type } = await this.authService.getStrategy(strategy)

        const permissions = await this.getUserPermissions(req.tokenUser!, req.workspace!)

        const userProfile: UserProfile = {
          firstname,
          lastname,
          email,
          picture_url,
          strategyType: type,
          strategy,
          isSuperAdmin,
          fullName: [firstname, lastname].filter(Boolean).join(' '),
          permissions
        }

        return sendSuccess(res, 'Retrieved profile successfully', userProfile)
      })
    )

    router.post(
      '/profile',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req: RequestWithUser, res) => {
        const { email, strategy } = req.tokenUser!

        validateBodySchema(
          req,
          Joi.object().keys({
            firstname: Joi.string()
              .min(0)
              .max(35)
              .trim()
              .allow(''),
            lastname: Joi.string()
              .min(0)
              .max(35)
              .trim()
              .allow(''),
            picture_url: Joi.string()
              .uri({ allowRelative: true })
              .allow('')
          })
        )

        await this.authService.updateAttributes(email, strategy, {
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          picture_url: req.body.picture_url
        })

        return sendSuccess(res, 'Updated profile successfully')
      })
    )

    router.get(
      '/workspaces',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req: RequestWithUser, res) => {
        const { email, strategy, isSuperAdmin } = req.tokenUser!

        if (!isSuperAdmin) {
          return res.send(await this.workspaceService.getUserWorkspaces(email, strategy))
        }

        res.send(
          await Promise.map(this.workspaceService.getWorkspaces(), w => {
            return { email, strategy, workspace: w.id, role: w.adminRole, workspaceName: w.name }
          })
        )
      })
    )
  }

  getUserPermissions = async (user: TokenUser, workspaceId: string): Promise<AuthRule[]> => {
    const { email, strategy, isSuperAdmin } = user
    const userRole = await this.workspaceService.getRoleForUser(email, strategy, workspaceId)

    if (isSuperAdmin) {
      return [{ res: '*', op: '+r+w' }]
    } else if (!userRole) {
      return [{ res: '*', op: '-r-w' }]
    } else {
      return userRole.rules
    }
  }
}

export default UserRouter
