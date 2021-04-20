import * as sdk from 'botpress/sdk'
import { TwilioContext } from 'src/backend/typings'

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
    await context.client.messages.create(context.message)
  }
}
