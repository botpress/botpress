import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/constants'
import { SmoochContext } from '../backend/typings'

export class SmoochImageRenderer implements ChannelRenderer<SmoochContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return SmoochImageRenderer.name
  }

  handles(context: SmoochContext): boolean {
    return !!context.payload.image
  }

  async render(context: SmoochContext) {
    const payload = context.payload as sdk.ImageContent

    context.messages.push({ type: 'image', mediaUrl: formatUrl(context.botUrl, payload.image) })
  }
}
