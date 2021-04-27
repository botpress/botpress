import * as sdk from 'botpress/sdk'
import path from 'path'
import { TelegramContext } from 'src/backend/typings'
import { Markup } from 'telegraf'
import Extra from 'telegraf/extra'

export class TelegramCarouselRenderer implements sdk.ChannelRenderer<TelegramContext> {
  get channel(): string {
    return 'telegram'
  }

  get priority(): number {
    return 0
  }

  get id() {
    return TelegramCarouselRenderer.name
  }

  async handles(context: TelegramContext): Promise<boolean> {
    return context.payload.items?.length
  }

  async render(context: TelegramContext): Promise<void> {
    const { messages } = context
    const payload = context.payload as sdk.CarouselContent

    for (const card of payload.items) {
      if (card.image) {
        messages.push({ action: 'upload_photo' })
        messages.push({ photo: { url: card.image, filename: path.basename(card.image) } })
      }

      const buttons = []
      for (const action of card.actions) {
        if (action.action === 'Open URL') {
          buttons.push(Markup.urlButton(action.title, (action as sdk.ActionOpenURL).url))
        } else if (action.action === 'Postback') {
          buttons.push(Markup.callbackButton(action.title, (action as sdk.ActionPostback).payload))
        } else if (action.action === 'Say something') {
          buttons.push(Markup.callbackButton(action.title, (action as sdk.ActionSaySomething).text as string))
        }
      }

      messages.push({
        text: `*${card.title}*\n${card.subtitle}`,
        extra: Extra.markdown(true).markup(Markup.inlineKeyboard(buttons))
      })
    }
  }
}
