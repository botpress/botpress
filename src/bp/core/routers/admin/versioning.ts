import { Logger } from 'botpress/sdk'
import { GhostService } from 'core/services'
import { BotService } from 'core/services/bot-service'
import { FileRevision } from 'core/services/ghost'
import { Router } from 'express'
import _ from 'lodash'

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

    // Return the list of the new / modified ghosted files compared to the local files.
    // Used when manually syncing local files to the ghost.
    this.router.get(
      '/changes',
      this.asyncMiddleware(async (req, res) => {
        const changes = await this.ghost.listFileChanges()
        res.json(changes)
      })
    )

    // Overwrite the production files with the local files
    this.router.post(
      '/update',
      this.asyncMiddleware(async (req, res) => {
        const botsIds = await this.botService.getBotsIds()
        await Promise.map(botsIds, id => this.ghost.forBot(id).forceUpdate())
        await this.ghost.global().forceUpdate()

        res.status(200).send({ success: true })
      })
    )
  }
}
