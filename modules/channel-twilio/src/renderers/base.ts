import * as sdk from 'botpress/sdk'
import { TwilioContext } from 'src/backend/typings'

export abstract class TwilioBaseRenderer implements sdk.ChannelRenderer<TwilioContext> {
  getChannel() {
    return 'twilio'
  }

  getPriority() {
    return 0
  }

  async handles(context: TwilioContext): Promise<boolean> {
    return context.event.type === this.getPayloadType()
  }

  abstract getId()

  abstract getPayloadType(): string

  abstract render(context: TwilioContext): Promise<boolean>
}
