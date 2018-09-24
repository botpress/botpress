import { inject, injectable, tagged } from 'inversify'
import generate from 'nanoid/generate'
import path from 'path'

import { TYPES } from '../../types'
import { GhostService } from '..'
import { Logger } from 'common/logging'

const safeId = (length = 10) => generate('1234567890abcdefghijklmnopqrsuvwxyz', length)

@injectable()
export default class MediaService {
  constructor(
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.Logger)
    @tagged('name', 'MediaService')
    private logger: Logger
  ) {}

  async saveFile(botId: string, fileName: string, content: Buffer): Promise<string> {
    this.logger.forBot(botId).debug(`Saving "${fileName}"`)
    fileName = `${safeId(20)}-${path.basename(fileName)}`
    await this.ghost.forBot(botId).upsertFile('media', fileName, content)
    return fileName
  }

  readFile(botId, fileName): Promise<Buffer> {
    return this.ghost.forBot(botId).readFileAsBuffer('media', fileName)
  }
}
