import * as sdk from 'botpress/sdk'
import { ChannelSender } from 'common/channel'
import { TwilioContext } from '../backend/typings'

export class TwilioCommonSender implements ChannelSender<TwilioContext> {
  get channel(): string {
    return 'twilio'
  }

  get priority(): number {
    return 0
  }

  get id() {
    return TwilioCommonSender.name
  }

  handles(context: TwilioContext): boolean {
    return context.handlers?.length > 0
  }

  async send(context: TwilioContext) {
    for (const message of context.messages) {
      await context.client.messages.create({
        ...message,
        from: context.botPhoneNumber,
        to: context.event.target
      })
    }
  }
}
