import * as sdk from 'botpress/sdk'
import { TelegramContext } from 'src/backend/typings'

export class TelegramTypingSender implements sdk.ChannelSender<TelegramContext> {
  get channel(): string {
    return 'telegram'
  }

  get priority(): number {
    return -1
  }

  get id() {
    return TelegramTypingSender.name
  }

  async handles(context: TelegramContext): Promise<boolean> {
    const typing = context.event.payload.typing
    return context.handlers?.length > 0 && (typing === undefined || typing === true)
  }

  async send(context: TelegramContext): Promise<void> {
    const delay = context.event.payload.delay ?? 1000
    await context.client.telegram.sendChatAction(context.chatId, 'typing')
    await Promise.delay(delay)
  }
}
