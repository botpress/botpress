import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { SmoochContext } from '../backend/typings'

export class SmoochCardRenderer implements ChannelRenderer<SmoochContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return SmoochCardRenderer.name
  }

  handles(context: SmoochContext): boolean {
    return context.payload.type === 'card'
  }

  render(context: SmoochContext) {
    const payload = context.payload as sdk.CardContent

    // we convert our card to a carousel
    context.payload = context.bp.experimental.render.carousel(payload)
  }
}
