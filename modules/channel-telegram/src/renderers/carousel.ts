import * as sdk from 'botpress/sdk'
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
    const { chatId } = args
    const payload = event.payload as sdk.CarouselContent

    if (payload.items?.length) {
      const { title, image, subtitle } = payload.items[0]
      const buttons = payload.items.map(x => x.actions || [])
      if (image) {
        await client.telegram.sendChatAction(chatId, 'upload_photo')
        await client.telegram.sendPhoto(chatId, { url: image, filename: path.basename(image) })
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
