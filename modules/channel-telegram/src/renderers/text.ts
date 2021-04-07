import * as sdk from 'botpress/sdk'
import { TelegramContext } from 'src/backend/typings'
import { Button, Markup } from 'telegraf'
import Extra from 'telegraf/extra'

export const TelegramTextRenderer: sdk.ChannelRenderer = {
  channel: 'telegram',
  id: 'telegram-text-renderer',
  priority: 0,

  async handles({ event }: TelegramContext): Promise<boolean> {
    return event.type === 'text'
  },

  async render({ event, client, args }: TelegramContext): Promise<boolean> {
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
