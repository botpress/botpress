import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { SlackContext } from '../backend/typings'

export class SlackTextRenderer implements ChannelRenderer<SlackContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return SlackTextRenderer.name
  }

  handles(context: SlackContext): boolean {
    return !!context.payload.text
  }

  render(context: SlackContext) {
    const payload = context.payload as sdk.TextContent

    context.message.text = payload.text as string
  }
}
