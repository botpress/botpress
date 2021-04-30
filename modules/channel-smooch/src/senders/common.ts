import { ChannelSender } from 'common/channel'
import { SmoochContext } from '../backend/typings'

export class SmoochCommonSender implements ChannelSender<SmoochContext> {
  get channel(): string {
    return 'smooch'
  }

  get priority(): number {
    return 0
  }

  get id() {
    return SmoochCommonSender.name
  }

  handles(context: SmoochContext): boolean {
    return context.handlers?.length > 0
  }

  async send(context: SmoochContext) {
    for (const message of context.messages) {
      await context.client.appUsers.sendMessage({
        appId: context.client.keyId,
        userId: context.event.target,
        message: { ...message, role: 'appMaker' }
      })
    }
  }
}
