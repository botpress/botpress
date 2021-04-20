import * as sdk from 'botpress/sdk'
import { TelegramContext } from 'src/backend/typings'

export class TelegramCommonSender implements sdk.ChannelSender<TelegramContext> {
  getChannel(): string {
    return 'telegram'
  }

  getPriority(): number {
    return 0
  }

  getId() {
    return TelegramCommonSender.name
  }

  async handles(context: TelegramContext): Promise<boolean> {
    return context.handlers?.length > 0
  }

  async send(context: TelegramContext): Promise<void> {
    const { client } = context

    for (const message of context.messages) {
      if (message.action) {
        await client.telegram.sendChatAction(message.chatId, message.action)
      }
      if (message.text) {
        await client.telegram.sendMessage(message.chatId, message.text, message.extra)
      }
      if (message.photo) {
        await client.telegram.sendPhoto(message.chatId, message.photo, message.extra)
      }
      if (message.animation) {
        await client.telegram.sendAnimation(message.chatId, message.animation, message.extra)
      }
    }
  }
}
