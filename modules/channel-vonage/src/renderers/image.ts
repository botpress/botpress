import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/client'
import { VonageContext } from '../backend/typings'

export class VonageImageRenderer implements ChannelRenderer<VonageContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return VonageImageRenderer.name
  }

  handles(context: VonageContext): boolean {
    return !!context.payload.image
  }

  async render(context: VonageContext) {
    const payload = context.payload as sdk.ImageContent

    context.messages.push({
      content: {
        type: 'image',
        text: undefined,
        image: {
          url: formatUrl(context.botUrl, payload.image),
          caption: payload.title as string
        }
      }
    })
  }
}
