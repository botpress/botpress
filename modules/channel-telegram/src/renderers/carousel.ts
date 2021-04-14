import path from 'path'
import { TelegramContext } from 'src/backend/typings'
import { CallbackButton, Markup } from 'telegraf'
import Extra from 'telegraf/extra'
import { TelegramBaseRenderer } from './base'

export class TelegramCarouselRenderer extends TelegramBaseRenderer {
  getId() {
    return TelegramCarouselRenderer.name
  }

  getPayloadType() {
    return 'carousel'
  }

  async render(context: TelegramContext): Promise<boolean> {
    const { event, client, args } = context
    const chatId = event.threadId || event.target

    if (event.payload.elements && event.payload.elements.length) {
      const { title, picture, subtitle } = event.payload.elements[0]
      const buttons = event.payload.elements.map(x => x.buttons)
      if (picture) {
        await client.telegram.sendChatAction(chatId, 'upload_photo')
        await client.telegram.sendPhoto(chatId, { url: picture, filename: path.basename(picture) })
      }
      const keyboard = args.keyboardButtons<CallbackButton>(buttons)
      await client.telegram.sendMessage(
        chatId,
        `*${title}*\n${subtitle}`,
        Extra.markdown(true).markup(Markup.inlineKeyboard(keyboard))
      )
    }

    return true
  }
}
