import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { Markup } from 'telegraf'
import Extra from 'telegraf/extra'
import { CHANNEL_NAME } from '../backend/constants'
import { TelegramContext } from '../backend/typings'

export class TelegramChoicesRenderer implements ChannelRenderer<TelegramContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 1
  }

  get id(): string {
    return TelegramChoicesRenderer.name
  }

  handles(context: TelegramContext): boolean {
    return !!(context.payload.choices && context.messages.length > 0)
  }

  render(context: TelegramContext) {
    const message = context.messages[0]
    const payload = context.payload as sdk.ChoiceContent

    const buttons = payload.choices.map(x => Markup.callbackButton(x.title as string, x.value))
    const keyboard = Markup.keyboard(buttons)

    message.extra = Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
  }
}
