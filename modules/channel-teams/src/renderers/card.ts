import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { TeamsContext } from '../backend/typings'

export class TeamsCardRenderer implements ChannelRenderer<TeamsContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return TeamsCardRenderer.name
  }

  handles(context: TeamsContext): boolean {
    return context.payload.type === 'card'
  }

  render(context: TeamsContext) {
    const payload = context.payload as sdk.CardContent

    // we convert our card to a carousel
    context.payload = context.bp.experimental.render.carousel(payload)
  }
}
