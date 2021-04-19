import * as sdk from 'botpress/sdk'
import { SlackContext } from 'src/backend/typings'
import { SlackBaseRenderer } from './base'

export class SlackTextRenderer extends SlackBaseRenderer {
  getId() {
    return SlackTextRenderer.name
  }

  getPayloadType(): string {
    return 'text'
  }

  async render(context: SlackContext): Promise<boolean> {
    const payload = context.event.payload as sdk.TextContent

    const message = {
      text: payload.text as string,
      channel: context.args.channelId,
      blocks: []
    }

    await context.client.web.chat.postMessage(message)

    return true
  }
}
