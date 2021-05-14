import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { MessengerContext } from '../backend/typings'

export class MessengerChoicesRenderer implements ChannelRenderer<MessengerContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 1
  }

  get id(): string {
    return MessengerChoicesRenderer.name
  }

  handles(context: MessengerContext): boolean {
    return !!(context.payload.choices && context.messages.length > 0)
  }

  render(context: MessengerContext) {
    const message = context.messages[0]
    const payload = context.payload as sdk.ChoiceContent

    message.quick_replies = payload.choices.map(c => ({
      content_type: 'text',
      title: c.title,
      payload: c.value.toUpperCase()
    }))
  }
}
