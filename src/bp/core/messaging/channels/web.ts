import { HTTPServer } from 'core/app/server'
import { Channel } from './base'

export class ChannelWeb extends Channel {
  get name() {
    return 'web'
  }

  async loadConfigForBot(botId: string) {
    return {}
  }

  setupRoutes(http: HTTPServer) {}

  setupProxies() {
    this.setupProxy('/webhook')
  }
}
