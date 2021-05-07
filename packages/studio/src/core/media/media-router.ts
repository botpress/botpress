import * as sdk from 'botpress/sdk'
import { ConfigProvider } from 'core/config'
import { fileUploadMulter } from 'core/routers'
import { CustomRouter } from 'core/routers/customRouter'
import { AuthService, TOKEN_AUDIENCE, checkTokenHeader, needPermissions } from 'core/security'
import { WorkspaceService } from 'core/users'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'
import ms from 'ms'
import path from 'path'

import { MediaServiceProvider } from './media-service-provider'

const DEFAULT_MAX_SIZE = '10mb'
const DEFAULT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'] // use ['*'] once implemented
const ONE_YEAR_SEC = ms('1y') / 1000
const debug = DEBUG('media')

// This uses the same "interface" as the Bot Media router
export class MediaRouter extends CustomRouter {
  private resource = 'media'
  private checkTokenHeader: RequestHandler
  private checkPermissions: (operation: string, resource: string) => RequestHandler
  private fileMulter: RequestHandler

  constructor(
    logger: sdk.Logger,
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private mediaServiceProvider: MediaServiceProvider,
    private configProvider: ConfigProvider
  ) {
    super('Media', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.checkPermissions = needPermissions(this.workspaceService)
    this.fileMulter = fileUploadMulter(DEFAULT_MIME_TYPES, DEFAULT_MAX_SIZE)
    this.setupPublicRoutes()
    this.setupPrivateRoutes()
  }

  async initialize() {
    const { allowedMimeTypes, maxFileSize } = (await this.configProvider.getBotpressConfig()).fileUpload
    this.fileMulter = fileUploadMulter(allowedMimeTypes, maxFileSize)
  }

  private setupPublicRoutes() {
    // if the need appears, add useStream param to which we can stream file straight from media service
    this.router.get(
      '/:filename',
      this.asyncMiddleware(async (req, res) => {
        const { filename } = req.params

        const type = path.extname(filename)
        const buff = await this.mediaServiceProvider
          .global()
          .readFile(filename)
          .catch(() => undefined)
        if (!buff) {
          return res.sendStatus(404)
        }
        // files are never overwritten because of the unique ID
        // so we can set the header to cache the asset for 1 year
        return res
          .set({ 'Cache-Control': `max-age=${ONE_YEAR_SEC}` })
          .type(type)
          .send(buff)
      })
    )
  }

  private setupPrivateRoutes() {
    this.router.post(
      '/',
      this.checkTokenHeader,
      this.checkPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        this.fileMulter(req, res, async err => {
          const email = req.tokenUser!.email
          if (err) {
            debug(`Failed (${email} from ${req.ip})`, err.message)
            return res.sendStatus(400)
          }
          const mediaService = this.mediaServiceProvider.global()
          const file = req['file']
          const { url, fileName } = await mediaService.saveFile(file.originalname, file.buffer)

          debug(
            `success (${email} from ${req.ip}). file: ${fileName} %o`,
            _.pick(file, 'originalname', 'mimetype', 'size')
          )

          res.json({ url })
        })
      })
    )
  }
}
