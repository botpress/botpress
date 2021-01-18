import { Logger } from 'botpress/sdk'
import { sanitize } from 'core/misc/utils'
import { inject, injectable, tagged } from 'inversify'
import nanoid from 'nanoid/generate'
import path from 'path'

import { GhostService } from '..'
import { TYPES } from '../../types'

import { GhostMediaService } from './ghost-media-service'
import { IMediaService } from './typings'

const safeId = (length = 10) => nanoid('1234567890abcdefghijklmnopqrsuvwxyz', length)
@injectable()
export class MediaServiceProvider {
  private _scopeServices: Dic<IMediaService> = {}
  private GLOBAL_KEY = '__GLOBAL_MEDIA__'

  // TODO add backend config
  constructor(@inject(TYPES.GhostService) private ghostProvider: GhostService) {}

  global() {
    if (!this._scopeServices[this.GLOBAL_KEY]) {
      this._scopeServices[this.GLOBAL_KEY] = new GhostMediaService(this.ghostProvider)
    }
    return this._scopeServices[this.GLOBAL_KEY]
  }

  forBot(botId: string) {
    if (!this._scopeServices[botId]) {
      this._scopeServices[botId] = new GhostMediaService(this.ghostProvider, botId)
    }
    return this._scopeServices[botId]
  }
}

// TODO remove this
@injectable()
export default class MediaService {
  constructor(
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.Logger)
    @tagged('name', 'MediaService')
    private logger: Logger
  ) {}

  async saveFile(botId: string, originalName: string, content: Buffer): Promise<string> {
    this.logger.forBot(botId).debug(`Saving "${originalName}"`)
    const fileName = sanitize(`${safeId(20)}-${path.basename(originalName)}`)
    await this.ghost.forBot(botId).upsertFile('media', fileName, content)
    return fileName
  }

  async readFile(botId: string, fileName: string): Promise<Buffer> {
    return this.ghost.forBot(botId).readFileAsBuffer('media', sanitize(fileName))
  }

  async deleteFile(botId: string, fileName: string): Promise<void> {
    this.logger.forBot(botId).debug(`Deleting "${fileName.substr(21)}"`)
    await this.ghost.forBot(botId).deleteFile('media', sanitize(fileName))
  }

  getFilePath(botId: string, fileName: string): string {
    return `${process.EXTERNAL_URL}/api/v1/bots/${botId}/media/${fileName}`
  }
}
