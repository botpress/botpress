import { Channel } from './base'

export class ChannelTelegram extends Channel {
  get name() {
    return 'telegram'
  }

  async loadConfigForBot(botId: string) {
    const baseConfig = await super.loadConfigForBot(botId)

    if (baseConfig) {
      return {
        ...baseConfig,
        webhookUrl: `${process.EXTERNAL_URL}/api/v1/bots/${botId}/mod/channel-telegram/webhook`
      }
    } else {
      return undefined
    }
  }

  setupProxies() {
    this.setupProxy('/webhook')
  }
}
