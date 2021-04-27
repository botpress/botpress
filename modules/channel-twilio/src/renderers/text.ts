import * as sdk from 'botpress/sdk'
import { TwilioContext } from '../backend/typings'

export class TwilioTextRenderer implements sdk.ChannelRenderer<TwilioContext> {
  get channel(): string {
    return 'twilio'
  }

  get priority(): number {
    return 0
  }

  get id() {
    return TwilioTextRenderer.name
  }

  handles(context: TwilioContext): boolean {
    return context.payload.text
  }

  async render(context: TwilioContext) {
    const payload = context.payload as sdk.TextContent

    context.messages.push({ body: payload.text as string })
  }
}
