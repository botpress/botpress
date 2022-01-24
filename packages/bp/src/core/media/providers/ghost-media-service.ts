import { ScopedGhostService } from 'botpress/sdk'
import { GhostService } from 'core/bpfs'
import { sanitize } from 'core/misc/utils'
import { customAlphabet } from 'nanoid'
import path from 'path'

import { MediaService } from '../media-service-interface'

const safeId = (length = 10) => customAlphabet('1234567890abcdefghijklmnopqrsuvwxyz', length)()

const debug = DEBUG('media')

export class GhostMediaService implements MediaService {
  private MEDIA_DIR = 'media'
  private ghost: ScopedGhostService
  constructor(ghostProvider: GhostService, private botId?: string) {
    this.ghost = this.botId ? ghostProvider.forBot(this.botId) : ghostProvider.global()
  }

  async saveFile(name: string, content: Buffer): Promise<{ url: string; fileName: string }> {
    const fileName = sanitize(`${safeId(20)}-${path.basename(name)}`)

    this.debug(`Saving media ${fileName}`)
    await this.ghost.upsertFile(this.MEDIA_DIR, fileName, content)
    return {
      url: this.getPublicURL(fileName),
      fileName
    }
  }

  async readFile(fileName: string): Promise<Buffer> {
    this.debug(`Reading media ${fileName}`)
    return this.ghost.readFileAsBuffer(this.MEDIA_DIR, sanitize(fileName))
  }

  async deleteFile(fileName: string): Promise<void> {
    this.debug(`Deleting media ${fileName}`)
    await this.ghost.deleteFile(this.MEDIA_DIR, sanitize(fileName))
  }

  private debug(message: string) {
    if (this.botId) {
      debug.forBot(this.botId, message)
    } else {
      debug(message)
    }
  }

  getPublicURL(fileName: string): string {
    // make sure the file name is a valid URI
    fileName = encodeURIComponent(fileName)
    if (this.botId) {
      return `/api/v1/bots/${this.botId}/media/${fileName}`
    } else {
      return `/api/v1/media/${fileName}`
    }
  }
}
