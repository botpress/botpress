import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import { JWT_COOKIE_NAME } from 'common/auth'
import { ChatUserAuth, RequestWithUser } from 'common/typings'
import { sendSuccess, BadRequestError } from 'core/routers'
import { StrategyBasic } from 'core/security'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'

class AuthRouter extends CustomAdminRouter {
  constructor(services: AdminServices) {
    super('Auth', services)

    this.setupRoutes()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.setupStrategies()
  }

  async setupStrategies() {
    // Waiting until the auth service was initialized (& config updated, if it's the first time)
    await AppLifecycle.waitFor(AppLifecycleEvents.SERVICES_READY)

    const strategyTypes = (await this.authService.getAllStrategies()).map(x => x.type)

    if (process.IS_PRO_ENABLED) {
      this.authStrategies.setup(this.router, strategyTypes)
    }

    if (strategyTypes.includes('basic')) {
      const basicStrategies = new StrategyBasic(this.logger, this.router, this.authService)
      await basicStrategies.setup()

      this.authService.strategyBasic = basicStrategies
    }
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/config',
      this.asyncMiddleware(async (req, res) => {
        return sendSuccess(res, 'Auth Config', await this.authService.getCollaboratorsConfig())
      })
    )

    router.get(
      '/refresh',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req: RequestWithUser, res) => {
        const config = await this.configProvider.getBotpressConfig()

        if (config.jwtToken && config.jwtToken.allowRefresh) {
          const newToken = await this.authService.refreshToken(req.tokenUser!)

          sendSuccess(res, 'Token refreshed successfully', {
            newToken: process.USE_JWT_COOKIES ? _.omit(newToken, 'jwt') : newToken
          })
        } else {
          const [, token] = req.headers.authorization!.split(' ')
          sendSuccess(res, 'Token not refreshed, sending back original', { newToken: token })
        }
      })
    )

    router.post(
      '/me/chatAuth',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req: RequestWithUser, res) => {
        const { botId, sessionId, signature } = req.body as ChatUserAuth

        if (!botId || !sessionId || !signature) {
          throw new BadRequestError('Missing required fields')
        }

        await this.authService.authChatUser(req.body, req.tokenUser!)
        res.send(await this.workspaceService.getBotWorkspaceId(botId))
      })
    )

    router.get(
      '/logout',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req: RequestWithUser, res) => {
        await this.authService.invalidateToken(req.tokenUser!)
        return this.authService.logout(req.tokenUser!.strategy, req, res)
      })
    )

    // Temporary route to obtain a token when using cookie authentication, for the bp pull/push command
    router.get(
      '/getToken',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req: RequestWithUser, res) => {
        if (!process.USE_JWT_COOKIES) {
          return res.sendStatus(201)
        }

        res.send(req.cookies[JWT_COOKIE_NAME])
      })
    )
  }
}

export default AuthRouter
