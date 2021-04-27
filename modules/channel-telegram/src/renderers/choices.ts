import * as sdk from 'botpress/sdk'
import { TelegramContext } from 'src/backend/typings'
import { Markup } from 'telegraf'
import Extra from 'telegraf/extra'

export class TelegramChoicesRenderer implements sdk.ChannelRenderer<TelegramContext> {
  get channel(): string {
    return 'telegram'
  }

  get priority(): number {
    return 1
  }

  get id() {
    return TelegramChoicesRenderer.name
  }

  handles(context: TelegramContext): boolean {
    return context.payload.choices && context.messages.length >= 1
  }

  render(context: TelegramContext) {
    const message = context.messages[0]
    const payload = context.payload as sdk.ChoiceContent

    const buttons = payload.choices.map(x => Markup.callbackButton(x.title as string, x.value))
    const keyboard = Markup.keyboard(buttons)

    message.extra = Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
  }
}
