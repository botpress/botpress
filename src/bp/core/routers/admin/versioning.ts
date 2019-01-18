import { BotLoader } from 'core/bot-loader'
import { GhostService } from 'core/services'
import { WorkspaceService } from 'core/services/workspace'
import { RequestHandler, Router } from 'express'

import { CustomRouter } from '..'
import { needPermissions } from '../util'

export class VersioningRouter implements CustomRouter {
  public readonly router: Router

  private _needPermissions: (operation: string, resource: string) => RequestHandler

  constructor(private workspaceService: WorkspaceService, private ghost: GhostService, private botLoader: BotLoader) {
    this._needPermissions = needPermissions(this.workspaceService)

    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get(
      '/pending',
      // TODO add "need super admin" once superadmin is implemented
      async (req, res) => {
        res.send(await this.ghost.global().getPending())
      }
    )

    this.router.get(
      '/export',
      // TODO add "need super admin" once superadmin is implemented
      async (req, res) => {
        const botIds = await this.botLoader.getAllBotIds()
        const tarball = await this.ghost.exportArchive(botIds)

        res.writeHead(200, {
          'Content-Type': 'application/tar+gzip',
          'Content-Disposition': `attachment; filename=archive_${Date.now()}.tgz`,
          'Content-Length': tarball.length
        })
        res.end(tarball)
      }
    )

    // Revision ID
    this.router.post('/revert', this._needPermissions('write', 'bot.ghost_content'), async (req, res) => {
      const revisionId = req.body.revision
      const filePath = req.body.filePath
      await this.ghost.forBot(req.params.botId).revertFileRevision(filePath, revisionId)
      res.sendStatus(200)
    })
  }
}
