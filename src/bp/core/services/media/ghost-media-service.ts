import { ScopedGhostService } from 'botpress/sdk'
import { sanitize } from 'core/misc/utils'
import nanoid from 'nanoid/generate'
import path from 'path'

import { GhostService } from '../ghost/service'

import { IMediaService as MediaService } from './typings'

const safeId = (length = 10) => nanoid('1234567890abcdefghijklmnopqrsuvwxyz', length)

const debug = DEBUG('media')

export class GhostMediaService implements MediaService {
  private MEDIA_DIR = 'media'
  private ghost: ScopedGhostService
  constructor(ghostProvider: GhostService, private botId?: string) {
    this.ghost = this.botId ? ghostProvider.forBot(this.botId) : ghostProvider.global()
  }

  async saveFile(name: string, content: Buffer): Promise<string> {
    const fileName = sanitize(`${safeId(20)}-${path.basename(name)}`)

    this.debug(`Saving media ${fileName}`)
    return this.ghost.upsertFile(this.MEDIA_DIR, fileName, content).then(() => fileName)
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

  // I kind of dislike this to be honest
  getPublicURL(fileName: string): string {
    if (this.botId) {
      return `${process.EXTERNAL_URL}/api/v1/bots/${this.botId}/media/${fileName}`
    } else {
      return `${process.EXTERNAL_URL}/api/v1/media/${fileName}`
    }
  }
}
