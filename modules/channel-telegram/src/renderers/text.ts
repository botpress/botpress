import { TelegramContext } from 'src/backend/typings'
import { Button, Markup } from 'telegraf'
import Extra from 'telegraf/extra'
import { TelegramBaseRenderer } from './base'

export class TelegramTextRenderer extends TelegramBaseRenderer {
  getId() {
    return TelegramTextRenderer.name
  }

  getPayloadType(): string {
    return 'text'
  }

  async render(context: TelegramContext): Promise<boolean> {
    const { event, client, args } = context
    const chatId = event.threadId || event.target

    const keyboard = Markup.keyboard(args.keyboardButtons<Button>(event.payload.quick_replies))
    if (event.payload.markdown !== false) {
      // Attempt at sending with markdown first, fallback to regular text on failure
      await client.telegram
        .sendMessage(chatId, event.preview, Extra.markdown(true).markup({ ...keyboard, one_time_keyboard: true }))
        .catch(() =>
          client.telegram.sendMessage(
            chatId,
            event.preview,
            Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
          )
        )
    } else {
      await client.telegram.sendMessage(
        chatId,
        event.preview,
        Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
      )
    }

    return true
  }
}
