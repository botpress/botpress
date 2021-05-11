import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/client'
import { VonageContext } from '../backend/typings'

export class VonageTextRenderer implements ChannelRenderer<VonageContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return VonageTextRenderer.name
  }

  handles(context: VonageContext): boolean {
    return !!context.payload.text
  }

  async render(context: VonageContext) {
    const payload = context.payload as sdk.TextContent

    context.messages.push({ content: { type: 'text', text: payload.text as string } })
  }
}
