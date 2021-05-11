import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/client'
import { VonageContext } from '../backend/typings'

export class VonageVideoRenderer implements ChannelRenderer<VonageContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return VonageVideoRenderer.name
  }

  handles(context: VonageContext): boolean {
    return !!context.payload.video
  }

  async render(context: VonageContext) {
    const payload = context.payload as sdk.VideoContent

    context.messages.push({
      content: {
        type: 'video',
        text: undefined,
        video: {
          url: formatUrl(context.botUrl, payload.video)
        }
      }
    })
  }
}
