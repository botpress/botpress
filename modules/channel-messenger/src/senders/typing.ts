import { ChannelSender } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { MessengerContext } from '../backend/typings'

export class MessengerTypingSender implements ChannelSender<MessengerContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return MessengerTypingSender.name
  }

  handles(context: MessengerContext): boolean {
    const typing = context.event.payload.typing
    return context.handlers.length > 0 && (typing === undefined || typing === true)
  }

  async send(context: MessengerContext) {
    const delay = context.event.payload.delay ?? 1000

    await context.client.sendAction(context.event.target, 'typing_on')
    await Promise.delay(delay)
    await context.client.sendAction(context.event.target, 'typing_off')
  }
}
