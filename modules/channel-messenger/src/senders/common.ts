import { ChannelSender } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { MessengerContext } from '../backend/typings'

export class MessengerCommonSender implements ChannelSender<MessengerContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return MessengerCommonSender.name
  }

  handles(context: MessengerContext): boolean {
    return context.handlers.length > 0
  }

  async send(context: MessengerContext) {
    for (const message of context.messages) {
      await context.client.sendMessage(context.event.target, message)
    }
  }
}
