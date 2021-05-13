import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/socket'
import { WebContext } from '../backend/typings'

export class WebCommonRenderer implements ChannelRenderer<WebContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return WebCommonRenderer.name
  }

  handles(context: WebContext): boolean {
    return true
  }

  render(context: WebContext) {
    context.messages.push(context.payload)
  }
}
