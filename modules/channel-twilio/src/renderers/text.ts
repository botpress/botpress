import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { TwilioContext } from '../backend/typings'

export class TwilioTextRenderer implements ChannelRenderer<TwilioContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return TwilioTextRenderer.name
  }

  handles(context: TwilioContext): boolean {
    return !!context.payload.text
  }

  async render(context: TwilioContext) {
    const payload = context.payload as sdk.TextContent

    context.messages.push({ body: payload.text as string })
  }
}
