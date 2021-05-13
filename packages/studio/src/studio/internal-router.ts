import { UnauthorizedError } from 'common/http'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

export class InternalRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Internal', services)
  }

  setupRoutes() {
    if (!process.env.INTERNAL_PASSWORD) {
      return
    }

    const router = this.router
    router.use((req, res, next) => {
      if (req.headers.authorization !== process.env.INTERNAL_PASSWORD) {
        return next(new UnauthorizedError('Invalid password'))
      }

      next()
    })

    router.post(
      '/updateTokenVersion',
      this.asyncMiddleware(async (req, res) => {
        const { email, strategy, tokenVersion } = req.body
        await this.authService.tokenVersionChange(email, strategy, tokenVersion)

        res.sendStatus(200)
      })
    )

    router.post(
      '/invalidateFile',
      this.asyncMiddleware(async (req, res) => {
        const { key } = req.body

        await this.objectCache.invalidate(key, true)

        res.sendStatus(200)
      })
    )

    router.post(
      '/setBotMountStatus',
      this.asyncMiddleware(async (req, res) => {
        const { botId, isMounted } = req.body
        isMounted ? await this.botService.localMount(botId) : await this.botService.localUnmount(botId)

        res.sendStatus(200)
      })
    )
  }
}
