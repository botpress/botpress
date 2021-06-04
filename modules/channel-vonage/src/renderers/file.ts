import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/client'
import { VonageContext } from '../backend/typings'

export class VonageFileRenderer implements ChannelRenderer<VonageContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return VonageFileRenderer.name
  }

  handles(context: VonageContext): boolean {
    return !!context.payload.file
  }

  async render(context: VonageContext) {
    const payload = context.payload // as sdk.FileContent

    context.messages.push({
      content: {
        type: 'file',
        text: undefined,
        file: {
          url: formatUrl(context.botUrl, payload.file),
          caption: payload.title as string
        }
      }
    })
  }
}
