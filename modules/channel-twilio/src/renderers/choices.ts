import * as sdk from 'botpress/sdk'
import { TwilioContext } from '../backend/typings'

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
    return context.payload.choices?.length && context.messages.length >= 1
  }

  async render(context: TwilioContext): Promise<void> {
    const message = context.messages[0]

    message.body = `${message.body}\n\n${context.payload.choices
      .map(({ title }, idx) => `${idx + 1}. ${title}`)
      .join('\n')}`

    context.args.prepareIndexResponse(context.event, context.payload.choices)
  }
}
