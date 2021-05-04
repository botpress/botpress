import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { TelegramContext } from '../backend/typings'

export class TelegramCardRenderer implements ChannelRenderer<TelegramContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return TelegramCardRenderer.name
  }

  handles(context: TelegramContext): boolean {
    return context.payload.type === 'card'
  }

  render(context: TelegramContext) {
    const payload = context.payload as sdk.CardContent

    // we convert our card to a carousel
    context.payload = context.bp.experimental.render.carousel(payload)
  }
}
