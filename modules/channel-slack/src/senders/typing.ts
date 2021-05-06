import { ChannelSender } from 'common/channel'
import { SlackContext } from 'src/backend/typings'
import { CHANNEL_NAME } from '../backend/constants'

export class SlackTypingSender implements ChannelSender<SlackContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return SlackTypingSender.name
  }

  handles(context: SlackContext): boolean {
    const typing = context.payload.typing
    return context.handlers.length > 0 && (typing === undefined || typing === true)
  }

  async send(context: SlackContext): Promise<void> {
    const delay = context.payload.delay ?? 1000
    // it seems the only way to send typing indicators is with rtm which is deprecated...
    await Promise.delay(delay)
  }
}
