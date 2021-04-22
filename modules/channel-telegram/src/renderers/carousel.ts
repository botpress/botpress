import * as sdk from 'botpress/sdk'
import path from 'path'
import { TelegramContext } from 'src/backend/typings'
import { CallbackButton, Markup } from 'telegraf'
import Extra from 'telegraf/extra'

export class TelegramCarouselRenderer implements sdk.ChannelRenderer<TelegramContext> {
  getChannel(): string {
    return 'telegram'
  }

  getPriority(): number {
    return 0
  }

  getId() {
    return TelegramCarouselRenderer.name
  }

  async handles(context: TelegramContext): Promise<boolean> {
    return context.payload.type === 'carousel'
  }

  async render(context: TelegramContext): Promise<void> {
    const { messages } = context
    const payload = context.payload as sdk.CarouselContent

    if (payload.items?.length) {
      const { title, image, subtitle } = payload.items[0]
      const buttons = payload.items.map(x => x.actions || [])

      if (image) {
        messages.push({ action: 'upload_photo' })
        messages.push({ photo: { url: image, filename: path.basename(image) } })
      }

      const keyboard = context.keyboardButtons<CallbackButton>(buttons)

      messages.push({
        text: `*${title}*\n${subtitle}`,
        extra: Extra.markdown(true).markup(Markup.inlineKeyboard(keyboard))
      })
    }
  }
}
