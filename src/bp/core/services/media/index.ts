import { inject, injectable, tagged } from 'inversify'
import nanoid from 'nanoid/generate'

import { GhostService } from '..'
import { TYPES } from '../../types'

import { GhostMediaService } from './ghost-media-service'
import { MediaService } from './typings'

const safeId = (length = 10) => nanoid('1234567890abcdefghijklmnopqrsuvwxyz', length)
@injectable()
export class MediaServiceProvider {
  private _scopeServices: Dic<MediaService> = {}
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
