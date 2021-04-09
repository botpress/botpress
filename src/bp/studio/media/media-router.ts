import { BotpressConfig } from 'core/config'
import { fileUploadMulter } from 'core/routers'
import _ from 'lodash'
import path from 'path'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

const debugMedia = DEBUG('audit:action:media-upload')

class MediaRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('User', services)
    void this.setupRoutes()
  }

  async setupRoutes() {
    const router = this.router

    router.get(
      '/:filename',
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const type = path.extname(req.params.filename)

        const mediaService = this.mediaServiceProvider.forBot(botId)
        const contents = await mediaService.readFile(req.params.filename).catch(() => undefined)
        if (!contents) {
          return res.sendStatus(404)
        }

        // files are never overwritten because of the unique ID
        // so we can set the header to cache the asset for 1 year
        return res
          .set({ 'Cache-Control': 'max-age=31556926' })
          .type(type)
          .send(contents)
      })
    )

    const botpressConfig = await this.configProvider.getBotpressConfig()
    const mediaUploadMulter = fileUploadMulter(
      botpressConfig.fileUpload.allowedMimeTypes ?? ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'video/mp4'],
      botpressConfig.fileUpload.maxFileSize ?? '25mb'
    )

    router.post(
      '/',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.media'),
      this.asyncMiddleware(async (req, res) => {
        mediaUploadMulter(req, res, async err => {
          const email = req.tokenUser!.email
          if (err) {
            debugMedia(`failed (${email} from ${req.ip})`, err.message)
            return res.sendStatus(400)
          }

          const botId = req.params.botId
          const mediaService = this.mediaServiceProvider.forBot(botId)
          const file = req['file']
          const { url, fileName } = await mediaService.saveFile(file.originalname, file.buffer)

          debugMedia(
            `success (${email} from ${req.ip}). file: ${fileName} %o`,
            _.pick(file, 'originalname', 'mimetype', 'size')
          )

          res.json({ url })
        })
      })
    )

    router.post(
      '/delete',
      this.checkTokenHeader,

      this.needPermissions('write', 'bot.media'),
      this.asyncMiddleware(async (req, res) => {
        const email = req.tokenUser!.email
        const botId = req.params.botId
        const files = this.cmsService.getMediaFiles(req.body)
        const mediaService = this.mediaServiceProvider.forBot(botId)

        await Promise.map(files, async f => {
          await mediaService.deleteFile(f)
          debugMedia(`successful deletion (${email} from ${req.ip}). file: ${f}`)
        })

        res.sendStatus(200)
      })
    )
  }
}

export default MediaRouter
