import { Logger } from 'botpress/sdk'
import { ActionServer } from 'common/typings'
import { ConfigProvider } from 'core/config/config-loader'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { RequestHandler, Router } from 'express'
import { Response } from 'express'

import { CustomRouter } from './customRouter'
import { checkTokenHeader } from './util'

interface ActionServersReponse extends Response {
  send: (actionServers: ActionServer[]) => any
}

export class ActionServersRouter extends CustomRouter {
  private checkTokenHeader!: RequestHandler

  constructor(logger: Logger, private authService: AuthService, private configProvider: ConfigProvider) {
    super('ActionServers', logger, Router())
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.setupRoutes()
  }

  private setupRoutes(): void {
    this.router.get(
      '/',
      this.checkTokenHeader,
      this.asyncMiddleware(async (_req, res: ActionServersReponse, _next) => {
        const config = await this.configProvider.getBotpressConfig()
        const actionServersConfig = config.actionServers
        const actionServers = [...actionServersConfig.remoteActionServers]
        if (actionServersConfig.localActionServer.enabled) {
          actionServers.unshift({
            id: 'local',
            baseUrl: `http://localhost:${actionServersConfig.localActionServer.port}`
          })
        }
        res.send(actionServers)
      })
    )
  }
}
