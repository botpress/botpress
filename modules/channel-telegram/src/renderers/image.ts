import * as sdk from 'botpress/sdk'
import { TelegramContext } from 'src/backend/typings'
import { Button, Markup } from 'telegraf'
import Extra from 'telegraf/extra'

export const TelegramImageRenderer: sdk.ChannelRenderer = {
  channel: 'telegram',
  id: 'telegram-image-renderer',
  priority: 0,

  async handles({ event }: TelegramContext): Promise<boolean> {
    return event.type === 'image'
  },

  async render({ event, client, args }: TelegramContext): Promise<boolean> {
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
