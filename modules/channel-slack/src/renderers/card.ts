import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { SlackContext } from '../backend/typings'

export class SlackCardRenderer implements ChannelRenderer<SlackContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return SlackCardRenderer.name
  }

  handles(context: SlackContext): boolean {
    return context.payload.type === 'card'
  }

  render(context: SlackContext) {
    const payload = context.payload as sdk.CardContent

    // we convert our card to a carousel
    context.payload = context.bp.experimental.render.carousel(payload)
  }
}
