import { Channel } from './base'

export class ChannelVonage extends Channel {
  get name() {
    return 'vonage'
  }

  setupProxies() {
    this.setupProxy('/webhooks/inbound', '/inbound')
    this.setupProxy('/webhooks/status', '/status')
  }
}
