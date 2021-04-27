import * as sdk from 'botpress/sdk'
import { SlackContext } from 'src/backend/typings'

export class SlackTypingSender implements sdk.ChannelSender<SlackContext> {
  get channel(): string {
    return 'slack'
  }

  get priority(): number {
    return -1
  }

  get id() {
    return SlackTypingSender.name
  }

  handles(context: SlackContext): boolean {
    const typing = context.payload.typing
    return context.handlers?.length > 0 && (typing === undefined || typing === true)
  }

  async send(context: SlackContext): Promise<void> {
    const delay = context.payload.delay ?? 1000
    // it seems the only way to send typing indicators is with rtm which is deprecated...
    await Promise.delay(delay)
  }
}
