import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { TwilioContext } from '../backend/typings'

export class TwilioDropdownRenderer implements ChannelRenderer<TwilioContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return TwilioDropdownRenderer.name
  }

  handles(context: TwilioContext): boolean {
    return !!context.payload.options?.length
  }

  render(context: TwilioContext) {
    const payload = context.payload // as sdk.DropdownContent

    // we convert our dropdown to choices
    context.payload = context.bp.experimental.render.choice(
      payload.message,
      ...payload.options.map(x => ({ title: x.label, value: x.value }))
    )
  }
}
