import * as sdk from 'botpress/sdk'
import { SlackContext } from 'src/backend/typings'

export class SlackTypingSender implements sdk.ChannelSender<SlackContext> {
  getChannel(): string {
    return 'slack'
  }

  getPriority(): number {
    return -1
  }

  getId() {
    return SlackTypingSender.name
  }

  async handles(context: SlackContext): Promise<boolean> {
    const typing = context.event.payload.typing
    return context.handlers?.length > 0 && (typing === undefined || typing === true)
  }

  async send(context: SlackContext): Promise<void> {
    console.log('send typing')
    // TODO send typing
    // it seems that we were only sending typing indicators with rtm?
  }
}
