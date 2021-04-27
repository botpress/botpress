import * as sdk from 'botpress/sdk'
import { SlackContext } from '../backend/typings'

export class SlackTextRenderer implements sdk.ChannelRenderer<SlackContext> {
  get channel(): string {
    return 'slack'
  }

  get priority(): number {
    return 0
  }

  get id() {
    return SlackTextRenderer.name
  }

  handles(context: SlackContext): boolean {
    return context.payload.text
  }

  render(context: SlackContext) {
    const payload = context.payload as sdk.TextContent

    context.message.text = payload.text as string
  }
}
