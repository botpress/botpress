import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { TelegramContext } from '../backend/typings'

export class TelegramDropdownRenderer implements ChannelRenderer<TelegramContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return TelegramDropdownRenderer.name
  }

  handles(context: TelegramContext): boolean {
    return !!context.payload.options?.length
  }

  render(context: TelegramContext) {
    const payload = context.payload // as sdk.DropdownContent

    // we convert our dropdown to choices
    context.payload = context.bp.experimental.render.choice(
      payload.message,
      ...payload.options.map(x => ({ title: x.label, value: x.value }))
    )
  }
}
