import * as sdk from 'botpress/sdk'
import { TelegramContext } from 'src/backend/typings'
import { Button, Markup } from 'telegraf'
import Extra from 'telegraf/extra'

export class TelegramChoicesRenderer implements sdk.ChannelRenderer<TelegramContext> {
  getChannel(): string {
    return 'telegram'
  }

  getPriority(): number {
    return 1
  }

  getId() {
    return TelegramChoicesRenderer.name
  }

  async handles(context: TelegramContext): Promise<boolean> {
    return context.payload.choices && context.messages.length >= 1
  }

  async render(context: TelegramContext): Promise<void> {
    const message = context.messages[0]
    const keyboard = Markup.keyboard(context.keyboardButtons<Button>(context.payload.choices))
    message.extra = Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
  }
}
