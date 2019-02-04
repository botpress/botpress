import { Logger } from 'botpress/sdk'
import { GhostService } from 'core/services'
import { BotService } from 'core/services/bot-service'
import { Router } from 'express'

import { CustomRouter } from '../customRouter'

export class VersioningRouter extends CustomRouter {
  constructor(logger: Logger, private ghost: GhostService, private botService: BotService) {
    super('Versioning', logger, Router({ mergeParams: true }))
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get(
      '/pending',
      this.asyncMiddleware(async (req, res) => {
        const botIds = await this.botService.getBotsIds()
        res.send(await this.ghost.getPending(botIds))
      })
    )

    this.router.get(
      '/export',
      this.asyncMiddleware(async (req, res) => {
        const botIds = await this.botService.getBotsIds()
        const tarball = await this.ghost.exportArchive(botIds)

        res.writeHead(200, {
          'Content-Type': 'application/tar+gzip',
          'Content-Disposition': `attachment; filename=archive_${Date.now()}.tgz`,
          'Content-Length': tarball.length
        })
        res.end(tarball)
      })
    )
  }
}
