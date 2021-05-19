import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { MessengerContext } from '../backend/typings'

export class MessengerDropdownRenderer implements ChannelRenderer<MessengerContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return MessengerDropdownRenderer.name
  }

  handles(context: MessengerContext): boolean {
    return !!context.payload.options?.length
  }

  render(context: MessengerContext) {
    const payload = context.payload // as sdk.DropdownContent

    // we convert our dropdown to choices
    context.payload = context.bp.experimental.render.choice(
      payload.message,
      ...payload.options.map(x => ({ title: x.label, value: x.value }))
    )
  }
}
