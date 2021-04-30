import { ChannelSender } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { TelegramContext } from '../backend/typings'

export class TelegramTypingSender implements ChannelSender<TelegramContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return TelegramTypingSender.name
  }

  handles(context: TelegramContext): boolean {
    const typing = context.event.payload.typing
    return context.handlers.length > 0 && (typing === undefined || typing === true)
  }

  async send(context: TelegramContext) {
    const delay = context.event.payload.delay ?? 1000
    await context.client.telegram.sendChatAction(context.chatId, 'typing')
    await Promise.delay(delay)
  }
}
