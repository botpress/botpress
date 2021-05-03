import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import path from 'path'
import { Markup } from 'telegraf'
import Extra from 'telegraf/extra'
import { CHANNEL_NAME } from '../backend/constants'
import { TelegramContext } from '../backend/typings'

export class TelegramCarouselRenderer implements ChannelRenderer<TelegramContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return TelegramCarouselRenderer.name
  }

  handles(context: TelegramContext): boolean {
    return !!context.payload.items?.length
  }

  render(context: TelegramContext) {
    const { messages } = context
    const payload = context.payload as sdk.CarouselContent

    for (const card of payload.items) {
      if (card.image) {
        messages.push({ action: 'upload_photo' })
        messages.push({ photo: { url: formatUrl(context.botUrl, card.image), filename: path.basename(card.image) } })
      }

      const buttons = []
      for (const action of card.actions || []) {
        if (action.action === sdk.ButtonAction.OpenUrl) {
          buttons.push(
            Markup.urlButton(action.title, (action as sdk.ActionOpenURL).url.replace('BOT_URL', context.botUrl))
          )
        } else if (action.action === sdk.ButtonAction.Postback) {
          buttons.push(Markup.callbackButton(action.title, (action as sdk.ActionPostback).payload))
        } else if (action.action === sdk.ButtonAction.SaySomething) {
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
