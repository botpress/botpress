import { Channel } from './base'

export class ChannelTelegram extends Channel {
  get name() {
    return 'telegram'
  }

  setupProxies() {
    this.setupProxy('/webhook')
  }
}
