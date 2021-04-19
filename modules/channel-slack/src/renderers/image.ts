import * as sdk from 'botpress/sdk'
import { SlackContext } from 'src/backend/typings'
import { SlackBaseRenderer } from './base'

export class SlackImageRenderer extends SlackBaseRenderer {
  getId() {
    return SlackImageRenderer.name
  }

  getPayloadType(): string {
    return 'image'
  }

  async render(context: SlackContext): Promise<boolean> {
    const payload = context.event.payload as sdk.ImageContent

    const message = {
      channel: context.args.channelId,
      text: undefined,
      blocks: [
        {
          type: 'image',
          title: payload.title && {
            type: 'plain_text',
            text: payload.title
          },
          image_url: payload.image,
          alt_text: 'image'
        }
      ]
    }

    await context.client.web.chat.postMessage(message)

    return true
  }
}
