import { ChannelSender } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { SmoochContext } from '../backend/typings'

export class SmoochTypingSender implements ChannelSender<SmoochContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return SmoochTypingSender.name
  }

  handles(context: SmoochContext): boolean {
    const typing = context.event.payload.typing
    return context.handlers.length > 0 && (typing === undefined || typing === true)
  }

  async send(context: SmoochContext) {
    const delay = context.event.payload.delay ?? 1000

    await context.client.appUsers.conversationActivity({
      appId: context.client.keyId,
      userId: context.event.target,
      activityProps: {
        role: 'appMaker',
        type: 'typing:start'
      }
    })

    await Promise.delay(delay)
  }
}
