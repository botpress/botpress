import { Logger } from 'botpress/sdk'
import { inject, injectable, tagged } from 'inversify'
import nanoid from 'nanoid/generate'
import path from 'path'

import { GhostService } from '..'
import { TYPES } from '../../types'

const safeId = (length = 10) => nanoid('1234567890abcdefghijklmnopqrsuvwxyz', length)

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
    const fileName = `${safeId(20)}-${path.basename(originalName)}`
    await this.ghost.forBot(botId).upsertFile('media', fileName, content)
    return fileName
  }

  async readFile(botId: string, fileName: string): Promise<Buffer> {
    return this.ghost.forBot(botId).readFileAsBuffer('media', fileName)
  }

  async deleteFile(botId: string, fileName: string): Promise<void> {
    this.logger.forBot(botId).debug(`Deleting "${fileName.substr(21)}"`)
    await this.ghost.forBot(botId).deleteFile('media', fileName)
  }

  getFilePath(botId: string, fileName: string): string {
    return `${process.EXTERNAL_URL}/api/v1/bots/${botId}/media/${fileName}`
  }
}
