import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { MessengerContext } from '../backend/typings'

export class MessengerTextRenderer implements ChannelRenderer<MessengerContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return MessengerTextRenderer.name
  }

  handles(context: MessengerContext): boolean {
    return !!context.payload.text
  }

  async render(context: MessengerContext) {
    const payload = context.payload as sdk.TextContent

    context.messages.push({ text: payload.text })
  }
}
