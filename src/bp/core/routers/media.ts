import * as sdk from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { MediaServiceProvider } from 'core/services/media'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'
import ms from 'ms'
import path from 'path'

import { CustomRouter } from './customRouter'
import { checkTokenHeader, fileUploadMulter, needPermissions } from './util'

const DEFAULT_MAX_SIZE = '10mb'
const DEFAULT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'] // use ['*'] once implemented
const ONE_YEAR_SEC = ms('1y') / 1000
const debug = DEBUG('media')

// This uses the exact same interface as the Bot Media router
// We shold have a single media router, will merge both later on
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
    this.setupRoutes()
  }

  async initialize() {
    const { allowedMimeTypes, maxFileSize } = (await this.configProvider.getBotpressConfig()).fileUpload
    this.fileMulter = fileUploadMulter(allowedMimeTypes, maxFileSize)
  }

  private setupRoutes() {
    // Public routes
    this.router.get(
      '/:filename',
      this.asyncMiddleware(async (req, res) => {
        const fn = req.params.filename
        // TODO add useStream param to which we can stream the file in request instead of sending the whole buffer

        const type = path.extname(fn)
        const buff = await this.mediaServiceProvider
          .global()
          .readFile(fn)
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
    // End of public routes

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
          const fileName = await mediaService.saveFile(file.originalname, file.buffer)
          const url = mediaService.getPublicURL(fileName)

          debug(
            `success (${email} from ${req.ip}). file: ${fileName} %o`,
            _.pick(file, 'originalname', 'mimetype', 'size')
          )

          res.json({ url })
        })
      })
    )

    // TODO check what we do with this bulk delete
    // this.router.post(
    //   '/media/delete',
    //   this.checkTokenHeader,
    //   this.checkPermissions('write', this.resource),
    //   this.asyncMiddleware(async (req, res) => {
    //     const email = req.tokenUser!.email
    //     const files = this.cmsService.getMediaFiles(req.body)
    //     files.forEach(async f => {
    //       await this.mediaService.deleteFile(botId, f)
    //       debugMedia(`successful deletion (${email} from ${req.ip}). file: ${f}`)
    //     })
    //     res.sendStatus(200)
    //   })
    // )
  }
}
