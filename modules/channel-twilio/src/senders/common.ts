import * as sdk from 'botpress/sdk'
import { TwilioContext } from '../backend/typings'

export class TwilioCommonSender implements sdk.ChannelSender<TwilioContext> {
  getChannel(): string {
    return 'twilio'
  }

  getPriority(): number {
    return 0
  }

  getId() {
    return TwilioCommonSender.name
  }

  async handles(context: TwilioContext): Promise<boolean> {
    return context.handlers?.length > 0
  }

  async send(context: TwilioContext): Promise<void> {
    for (const message of context.messages) {
      await context.client.messages.create({
        ...message,
        from: context.args.botPhoneNumber,
        to: context.event.target
      })
    }
  }
}
