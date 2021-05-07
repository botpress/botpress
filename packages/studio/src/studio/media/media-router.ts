import { BotpressConfig } from 'core/config'
import { fileUploadMulter } from 'core/routers'
import _ from 'lodash'
import path from 'path'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

const debugMedia = DEBUG('audit:action:media-upload')

const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'video/mp4']
const DEFAULT_MAX_FILE_SIZE = '25mb'

class MediaRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('User', services)
  }

  async setupRoutes(botpressConfig: BotpressConfig) {
    const router = this.router

    const mediaUploadMulter = fileUploadMulter(
      botpressConfig.fileUpload.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES,
      botpressConfig.fileUpload.maxFileSize ?? DEFAULT_MAX_FILE_SIZE
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
            return res.status(400).send(err.message)
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
