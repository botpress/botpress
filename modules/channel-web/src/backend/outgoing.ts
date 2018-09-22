import { BotpressEvent, ChannelOutgoingHandler } from 'botpress-module-sdk'

export default class OutgoingHandler implements ChannelOutgoingHandler {
  readonly channel: string = 'webchat'

  async processContentElement(element: any): Promise<BotpressEvent[]> {
    return []
  }
}
