import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { TwilioContext } from '../backend/typings'

export class TwilioChoicesRenderer implements ChannelRenderer<TwilioContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 1
  }

  get id(): string {
    return TwilioChoicesRenderer.name
  }

  handles(context: TwilioContext): boolean {
    return !!(context.payload.choices?.length && context.messages.length > 0)
  }

  render(context: TwilioContext) {
    const message = context.messages[0]

    message.body = `${message.body}\n\n${context.payload.choices
      .map(({ title }, idx) => `${idx + 1}. ${title}`)
      .join('\n')}`

    context.prepareIndexResponse(context.event, context.payload.choices)
  }
}
