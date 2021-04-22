import * as sdk from 'botpress/sdk'
import { SlackContext } from '../backend/typings'

export class SlackTextRenderer implements sdk.ChannelRenderer<SlackContext> {
  getChannel(): string {
    return 'slack'
  }

  getPriority(): number {
    return 0
  }

  getId() {
    return SlackTextRenderer.name
  }

  async handles(context: SlackContext): Promise<boolean> {
    return context.payload.text
  }

  async render(context: SlackContext): Promise<void> {
    const payload = context.payload as sdk.TextContent

    context.message.text = payload.text as string
  }
}
