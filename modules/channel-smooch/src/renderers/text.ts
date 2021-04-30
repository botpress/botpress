import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { SmoochContext } from '../backend/typings'

export class SmoochTextRenderer implements ChannelRenderer<SmoochContext> {
  get channel(): string {
    return 'smooch'
  }

  get priority(): number {
    return 0
  }

  get id() {
    return SmoochTextRenderer.name
  }

  handles(context: SmoochContext): boolean {
    return context.payload.text
  }

  async render(context: SmoochContext) {
    const payload = context.payload as sdk.TextContent

    context.messages.push({ type: 'text', text: payload.text })
  }
}
