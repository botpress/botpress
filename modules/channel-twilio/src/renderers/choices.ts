import * as sdk from 'botpress/sdk'
import { TwilioContext } from 'src/backend/typings'

export class TwilioChoicesRenderer implements sdk.ChannelRenderer<TwilioContext> {
  getChannel(): string {
    return 'twilio'
  }

  getPriority(): number {
    return 1
  }

  getId() {
    return TwilioChoicesRenderer.name
  }

  async handles(context: TwilioContext): Promise<boolean> {
    return context.event.payload.choices?.length
  }

  async render(context: TwilioContext): Promise<void> {
    context.message.body = `${context.message.body}\n\n${context.event.payload.choices
      .map(({ title }, idx) => `${idx + 1}. ${title}`)
      .join('\n')}`

    context.args.prepareIndexResponse(context.event, context.event.payload.choices)
  }
}
