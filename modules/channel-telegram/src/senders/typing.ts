import * as sdk from 'botpress/sdk'
import { TelegramContext } from 'src/backend/typings'

export class TelegramTypingSender implements sdk.ChannelSender<TelegramContext> {
  getChannel(): string {
    return 'telegram'
  }

  getPriority(): number {
    return -1
  }

  getId() {
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
