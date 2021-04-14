import { TelegramContext } from 'src/backend/typings'
import { Button, Markup } from 'telegraf'
import Extra from 'telegraf/extra'
import { TelegramBaseRenderer } from './base'

export class TelegramImageRenderer extends TelegramBaseRenderer {
  getId() {
    return TelegramImageRenderer.name
  }

  getPayloadType(): string {
    return 'image'
  }

  async render(context: TelegramContext): Promise<boolean> {
    const { event, client, args } = context
    const chatId = event.threadId || event.target

    const keyboard = Markup.keyboard(args.keyboardButtons<Button>(event.payload.quick_replies))
    if (event.payload.url.toLowerCase().endsWith('.gif')) {
      await client.telegram.sendAnimation(
        chatId,
        event.payload.url,
        Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
      )
    } else {
      await client.telegram.sendPhoto(
        chatId,
        event.payload.url,
        Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
      )
    }

    return true
  }
}
