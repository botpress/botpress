import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/constants'
import { MessengerContext } from '../backend/typings'

export class MessengerImageRenderer implements ChannelRenderer<MessengerContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return MessengerImageRenderer.name
  }

  handles(context: MessengerContext): boolean {
    return !!context.payload.image
  }

  render(context: MessengerContext) {
    const payload = context.payload as sdk.ImageContent

    // TODO: image caption

    context.messages.push({
      attachment: {
        type: 'image',
        payload: {
          is_reusable: true,
          url: formatUrl(context.botUrl, payload.image)
        }
      }
    })
  }
}
