import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { SmoochContext } from '../backend/typings'

export class SmoochChoicesRenderer implements ChannelRenderer<SmoochContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 1
  }

  get id(): string {
    return SmoochChoicesRenderer.name
  }

  handles(context: SmoochContext): boolean {
    return !!(context.payload.choices?.length && context.messages.length > 0)
  }

  async render(context: SmoochContext) {
    const message = context.messages[0]
    const payload = context.payload as sdk.ChoiceContent

    message.actions = payload.choices.map(r => ({ type: 'reply', text: r.title, payload: r.value }))
  }
}
