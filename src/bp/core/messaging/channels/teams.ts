import { Channel } from './base'

export class ChannelTeams extends Channel {
  get name() {
    return 'teams'
  }

  setupProxies() {
    this.setupProxy('/api/messages')
  }
}
