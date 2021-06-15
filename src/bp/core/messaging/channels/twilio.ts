import { Channel } from './base'

export class ChannelTwilio extends Channel {
  get name() {
    return 'twilio'
  }

  async loadConfigForBot(botId: string) {
    const baseConfig = await super.loadConfigForBot(botId)

    if (baseConfig) {
      return {
        ...baseConfig,
        webhookUrl: `${process.EXTERNAL_URL}/api/v1/bots/${botId}/mod/channel-twilio/webhook`
      }
    } else {
      return undefined
    }
  }

  setupProxies() {
    this.setupProxy('/webhook')
  }
}
