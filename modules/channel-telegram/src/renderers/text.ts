import * as sdk from 'botpress/sdk'
import Telegraf, { Button, ContextMessageUpdate, Markup } from 'telegraf'
import Extra from 'telegraf/extra'

type TelegramContext = sdk.ChannelContext<Telegraf<ContextMessageUpdate>, any>

export const TelegramTextRenderer: sdk.ChannelRenderer = {
  id: 'telegram-text-renderer',
  priority: 0,
  channel: 'telegram',

  async handles(context: TelegramContext): Promise<boolean> {
    return context.event.type === 'text'
  },

  async render(context: TelegramContext): Promise<boolean> {
    const chatId = context.event.threadId || context.event.target

    const keyboard = Markup.keyboard(context.args.keyboardButtons(context.event.payload.quick_replies))
    if (context.event.payload.markdown !== false) {
      // Attempt at sending with markdown first, fallback to regular text on failure
      await context.client.telegram
        .sendMessage(
          chatId,
          context.event.preview,
          Extra.markdown(true).markup({ ...keyboard, one_time_keyboard: true })
        )
        .catch(() =>
          context.client.telegram.sendMessage(
            chatId,
            context.event.preview,
            Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
          )
        )
    } else {
      await context.client.telegram.sendMessage(
        chatId,
        context.event.preview,
        Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
      )
    }

    return true
  }
}
