import * as sdk from 'botpress/sdk'
import { TwilioContext } from 'src/backend/typings'

export class TwilioTextRenderer implements sdk.ChannelRenderer<TwilioContext> {
  getChannel(): string {
    return 'twilio'
  }

  getPriority(): number {
    return 0
  }

  getId() {
    return TwilioTextRenderer.name
  }

  async handles(context: TwilioContext): Promise<boolean> {
    return context.payload.text
  }

  async render(context: TwilioContext): Promise<void> {
    const payload = context.payload as sdk.TextContent

    context.messages.push({ body: payload.text as string })
  }
}
