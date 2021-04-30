import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/constants'
import { SlackContext } from '../backend/typings'

export class SlackImageRenderer implements ChannelRenderer<SlackContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return SlackImageRenderer.name
  }

  handles(context: SlackContext): boolean {
    return !!context.payload.image
  }

  render(context: SlackContext) {
    const payload = context.payload as sdk.ImageContent

    context.message.blocks.push({
      type: 'image',
      title: payload.title && {
        type: 'plain_text',
        text: payload.title as string
      },
      image_url: formatUrl(context.botUrl, payload.image),
      alt_text: 'image'
    })
  }
}
