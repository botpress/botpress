import { Channel } from './base'

export class ChannelSlack extends Channel {
  get name() {
    return 'slack'
  }

  setupProxies() {
    this.setupProxy('/bots/:botId/callback', '/interactive')
    this.setupProxy('/bots/:botId/events-callback', '/events')
  }
}
