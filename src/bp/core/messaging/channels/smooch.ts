import { Channel } from './base'

export class ChannelSmooch extends Channel {
  get name() {
    return 'smooch'
  }

  async loadConfigForBot(botId: string) {
    const baseConfig = await super.loadConfigForBot(botId)

    if (baseConfig) {
      return {
        ...baseConfig,
        webhookUrl: `${process.EXTERNAL_URL}/api/v1/bots/${botId}/mod/channel-smooch/webhook`
      }
    } else {
      return undefined
    }
  }

  setupProxies() {
    this.setupProxy('/webhook')
  }
}
