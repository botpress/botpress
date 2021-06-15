import { Channel } from './base'

export class ChannelMessenger extends Channel {
  get name() {
    return 'messenger'
  }

  get mergeGlobalConfig() {
    return true
  }

  setupProxies() {
    this.setupProxy('/webhook')
  }
}
