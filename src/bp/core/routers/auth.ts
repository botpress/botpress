import { Logger } from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import { RequestWithUser } from 'core/misc/interfaces'
import { AuthStrategies } from 'core/services/auth-strategies'
import AuthService, { TOKEN_AUDIENCE, WORKSPACE_HEADER } from 'core/services/auth/auth-service'
import StrategyBasic from 'core/services/auth/basic'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'
import Joi from 'joi'
import _ from 'lodash'

import { CustomRouter } from './customRouter'
import { NotFoundError } from './errors'
import { checkTokenHeader, success as sendSuccess, validateBodySchema } from './util'

export class AuthRouter extends CustomRouter {
  private checkTokenHeader!: RequestHandler

  constructor(
    private logger: Logger,
    private authService: AuthService,
    private configProvider: ConfigProvider,
    private workspaceService: WorkspaceService,
    private authStrategies: AuthStrategies
  ) {
    super('Auth', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)

    // tslint:disable-next-line: no-floating-promises
    this.setupRoutes()
    // tslint:disable-next-line: no-floating-promises
    this.setupStrategies()
  }

  async setupStrategies() {
    const strategyTypes = await this.authService.getStrategyTypes()

    if (process.IS_PRO_ENABLED && _.intersection(strategyTypes, ['ldap', 'saml'])) {
      this.authStrategies.setup(this.router)
    }

    if (strategyTypes.includes('basic')) {
      const basicStrategies = new StrategyBasic(this.logger, this.router, this.authService)
      basicStrategies.setup()

      this.authService.strategyBasic = basicStrategies
    }
  }

  async setupRoutes() {
    const router = this.router

    router.get(
      '/config',
      this.asyncMiddleware(async (req, res) => {
        return sendSuccess(res, 'Auth Config', await this.authService.getCollaboratorsConfig())
      })
    )

    router.get('/ping', this.checkTokenHeader, this.asyncMiddleware(this.sendSuccess))

    router.get(
      '/me/profile',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req: RequestWithUser, res) => {
        const { email, strategy, isSuperAdmin } = req.tokenUser!

        const user = await this.authService.findUserAttributes(email, strategy)
        if (!user) {
          throw new NotFoundError(`User ${email || ''} not found`)
        }

        const userRole = await this.workspaceService.getRoleForUser(email, strategy, req.workspace!)

        const userProfile = {
          ...user,
          email,
          isSuperAdmin,
          fullName: [user.firstname, user.lastname].filter(Boolean).join(' '),
          permissions: userRole && userRole.rules
        }

        return sendSuccess(res, 'Retrieved profile successfully', userProfile)
      })
    )

    router.post(
      '/me/profile',
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
              .required(),
            lastname: Joi.string()
              .min(0)
              .max(35)
              .trim()
              .required()
          })
        )

        await this.authService.updateAttributes(email, strategy, {
          firstname: req.body.firstname,
          lastname: req.body.lastname
        })

        return sendSuccess(res, 'Updated profile successfully')
      })
    )

    router.get(
      '/me/workspaces',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req: RequestWithUser, res) => {
        const { email, strategy } = req.tokenUser!
        res.send(await this.workspaceService.getUserWorkspaces(email, strategy))
      })
    )

    router.get(
      '/me/permissions',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { email, strategy } = req.tokenUser!

        const role = await this.workspaceService.getRoleForUser(email, strategy, req.workspace!)
        if (!role) {
          throw new NotFoundError(`Role for user "${email}" doesn't exist`)
        }
        return sendSuccess(res, "Retrieved user's permissions successfully", role.rules)
      })
    )

    router.get(
      '/refresh',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req: RequestWithUser, res) => {
        const config = await this.configProvider.getBotpressConfig()

        if (config.jwtToken && config.jwtToken.allowRefresh) {
          const newToken = await this.authService.refreshToken(req.tokenUser!)
          sendSuccess(res, 'Token refreshed successfully', { newToken })
        } else {
          const [, token] = req.headers.authorization!.split(' ')
          sendSuccess(res, 'Token not refreshed, sending back original', { newToken: token })
        }
      })
    )
  }

  sendSuccess = async (req, res) => {
    return sendSuccess(res)
  }
}
