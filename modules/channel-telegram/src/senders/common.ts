import * as sdk from 'botpress/sdk'
import { TelegramContext } from 'src/backend/typings'

export class TelegramCommonSender implements sdk.ChannelSender<TelegramContext> {
  get channel(): string {
    return 'telegram'
  }

  get priority(): number {
    return 0
  }

  get id() {
    return TelegramCommonSender.name
  }

  async handles(context: TelegramContext): Promise<boolean> {
    return context.handlers?.length > 0
  }

  async send(context: TelegramContext): Promise<void> {
    const { client, chatId } = context

    for (const message of context.messages) {
      if (message.action) {
        await client.telegram.sendChatAction(chatId, message.action)
      }
      if (message.text) {
        await client.telegram.sendMessage(chatId, message.text, message.extra)
      }
      if (message.photo) {
        await client.telegram.sendPhoto(chatId, message.photo, message.extra)
      }
      if (message.animation) {
        await client.telegram.sendAnimation(chatId, message.animation, message.extra)
      }
    }
  }
}
