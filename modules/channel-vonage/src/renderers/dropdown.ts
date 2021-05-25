import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/client'
import { VonageContext } from '../backend/typings'

export class VonageDropdownRenderer implements ChannelRenderer<VonageContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return VonageDropdownRenderer.name
  }

  handles(context: VonageContext): boolean {
    return !!context.payload.options?.length
  }

  render(context: VonageContext) {
    const payload = context.payload // as sdk.DropdownContent

    // we convert our dropdown to choices
    context.payload = context.bp.experimental.render.choice(
      payload.message,
      ...payload.options.map(x => ({ title: x.label, value: x.value }))
    )
  }
}
