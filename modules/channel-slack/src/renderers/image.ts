import * as sdk from 'botpress/sdk'
import { SlackContext } from '../backend/typings'

export class SlackImageRenderer implements sdk.ChannelRenderer<SlackContext> {
  getChannel(): string {
    return 'slack'
  }

  getPriority(): number {
    return 0
  }

  getId() {
    return SlackImageRenderer.name
  }

  async handles(context: SlackContext): Promise<boolean> {
    return context.event.payload.image
  }

  async render(context: SlackContext): Promise<void> {
    const payload = context.event.payload as sdk.ImageContent

    context.message.blocks.push({
      type: 'image',
      title: payload.title && {
        type: 'plain_text',
        text: payload.title as string
      },
      image_url: payload.image,
      alt_text: 'image'
    })
  }
}
