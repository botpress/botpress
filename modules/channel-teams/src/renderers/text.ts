import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { TeamsContext } from '../backend/typings'

export class TeamsTextRenderer implements ChannelRenderer<TeamsContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return TeamsTextRenderer.name
  }

  handles(context: TeamsContext): boolean {
    return !!context.payload.text
  }

  async render(context: TeamsContext) {
    const payload = context.payload as sdk.TextContent

    context.messages.push({ text: payload.text as string })
  }
}
