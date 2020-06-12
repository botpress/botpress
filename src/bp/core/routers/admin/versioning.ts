import { Logger } from 'botpress/sdk'
import { UnexpectedError } from 'common/http'
import { extractArchive } from 'core/misc/archive'
import { GhostService } from 'core/services'
import { BotService } from 'core/services/bot-service'
import { Router } from 'express'
import _ from 'lodash'
import mkdirp from 'mkdirp'
import path from 'path'
import tmp from 'tmp'

import { CustomRouter } from '../customRouter'

export class VersioningRouter extends CustomRouter {
  constructor(private logger: Logger, private ghost: GhostService, private botService: BotService) {
    super('Versioning', logger, Router({ mergeParams: true }))
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get(
      '/export',
      this.asyncMiddleware(async (req, res) => {
        const archive = await this.ghost.exportArchive()

        res.writeHead(200, {
          'Content-Type': 'application/tar+gzip',
          'Content-Disposition': `attachment; filename=archive_${Date.now()}.tgz`,
          'Content-Length': archive.length
        })
        res.end(archive)
      })
    )

    this.router.post(
      '/changes',
      this.asyncMiddleware(async (req, res) => {
        const tmpDir = tmp.dirSync({ unsafeCleanup: true })

        try {
          await this.extractArchiveFromRequest(req, tmpDir.name)

          res.send(await this.ghost.listFileChanges(tmpDir.name))
        } catch (error) {
          res.status(500).send('Error while listing changes')
        } finally {
          tmpDir.removeCallback()
        }
      })
    )

    // Force update of the remote files by the local files
    this.router.post(
      '/update',
      this.asyncMiddleware(async (req, res) => {
        const tmpDir = tmp.dirSync({ unsafeCleanup: true })
        const beforeBotIds = await this.botService.getBotsIds()

        try {
          await this.extractArchiveFromRequest(req, tmpDir.name)
          const newBotIds = await this.ghost.forceUpdate(tmpDir.name)

          this.logger.info(`Unmounting bots: ${beforeBotIds.join(', ')}`)
          this.logger.info(`Mounting bots: ${newBotIds.join(', ')}`)

          // Unmount all previous bots and re-mount only the remaining (and new) bots
          await Promise.map(beforeBotIds, id => this.botService.unmountBot(id))
          await Promise.map(newBotIds, id => this.botService.mountBot(id))

          res.sendStatus(200)
        } catch (error) {
          throw new UnexpectedError('Error while pushing changes', error)
        } finally {
          tmpDir.removeCallback()
        }
      })
    )

    this.router.get('/bpfs_status', (req, res) => {
      res.send({ isAvailable: process.BPFS_STORAGE === 'database' })
    })
  }

  extractArchiveFromRequest = async (request, folder) => {
    const dataFolder = path.join(folder, 'data')
    await mkdirp.sync(dataFolder)

    const buffer: Buffer[] = []
    request.on('data', chunk => buffer.push(chunk))

    await Promise.fromCallback(cb => request.on('end', cb))
    await extractArchive(Buffer.concat(buffer), dataFolder)
  }
}
