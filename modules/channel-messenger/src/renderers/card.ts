import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { MessengerContext } from '../backend/typings'

export class MessengerCardRenderer implements ChannelRenderer<MessengerContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return MessengerCardRenderer.name
  }

  handles(context: MessengerContext): boolean {
    return context.payload.type === 'card'
  }

  render(context: MessengerContext) {
    const payload = context.payload as sdk.CardContent

    // we convert our card to a carousel
    context.payload = context.bp.experimental.render.carousel(payload)
  }
}
