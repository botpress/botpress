import { ChannelSender } from 'common/channel'
import { TelegramContext } from '../backend/typings'

export class TelegramTypingSender implements ChannelSender<TelegramContext> {
  get channel(): string {
    return 'telegram'
  }

  get priority(): number {
    return -1
  }

  get id() {
    return TelegramTypingSender.name
  }

  handles(context: TelegramContext): boolean {
    const typing = context.event.payload.typing
    return context.handlers?.length > 0 && (typing === undefined || typing === true)
  }

  async send(context: TelegramContext) {
    const delay = context.event.payload.delay ?? 1000
    await context.client.telegram.sendChatAction(context.chatId, 'typing')
    await Promise.delay(delay)
  }
}
