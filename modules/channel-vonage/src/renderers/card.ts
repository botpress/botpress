import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/client'
import { VonageContext } from '../backend/typings'

export class VonageCardRenderer implements ChannelRenderer<VonageContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return VonageCardRenderer.name
  }

  handles(context: VonageContext): boolean {
    return context.payload.type === 'card'
  }

  render(context: VonageContext) {
    const payload = context.payload as sdk.CardContent

    // we convert our card to a carousel
    context.payload = context.bp.experimental.render.carousel(payload)
  }
}
