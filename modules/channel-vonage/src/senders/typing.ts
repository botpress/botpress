import { ChannelSender } from 'common/channel'
import { CHANNEL_NAME } from '../backend/client'
import { VonageContext } from '../backend/typings'

export class VonageTypingSender implements ChannelSender<VonageContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return VonageTypingSender.name
  }

  handles(context: VonageContext): boolean {
    const typing = context.event.payload.typing
    return context.handlers.length > 0 && (typing === undefined || typing === true)
  }

  async send(context: VonageContext) {
    const delay = context.event.payload.delay ?? 1000
    await Promise.delay(delay)
  }
}
