import * as sdk from 'botpress/sdk'
import { TelegramContext } from 'src/backend/typings'

export abstract class TelegramBaseRenderer implements sdk.ChannelRenderer<TelegramContext> {
  getChannel() {
    return 'telegram'
  }

  getPriority() {
    return 0
  }

  async handles(context: TelegramContext): Promise<boolean> {
    return context.event.type === this.getPayloadType()
  }

  abstract getId()

  abstract getPayloadType(): string

  abstract render(context: TelegramContext): Promise<boolean>
}
