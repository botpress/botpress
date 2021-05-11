import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/client'
import { VonageContext } from '../backend/typings'

export class VonageChoicesRenderer implements ChannelRenderer<VonageContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 1
  }

  get id(): string {
    return VonageChoicesRenderer.name
  }

  handles(context: VonageContext): boolean {
    return !!(context.payload.choices?.length && context.messages.length > 0)
  }

  render(context: VonageContext) {
    // TODO: Add a whole new message instead of modifying the text?

    const message = context.messages[0]

    message.content.text = `${message.content.text}\n\n${context.payload.choices
      .map(({ title }, idx) => `*(${idx + 1})* ${title}`)
      .join('\n')}`

    context.prepareIndexResponse(context.event, context.payload.choices)
  }
}
