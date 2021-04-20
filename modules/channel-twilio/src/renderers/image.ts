import * as sdk from 'botpress/sdk'
import { TwilioContext } from 'src/backend/typings'

export class TwilioImageRenderer implements sdk.ChannelRenderer<TwilioContext> {
  getChannel(): string {
    return 'twilio'
  }

  getPriority(): number {
    return 0
  }

  getId() {
    return TwilioImageRenderer.name
  }

  async handles(context: TwilioContext): Promise<boolean> {
    return context.event.type === 'image'
  }

  async render(context: TwilioContext): Promise<void> {
    const payload = context.event.payload as sdk.ImageContent

    context.message.body = payload.title as string

    // TODO fix this
    const msg = <any>context.message
    msg.mediaUrl = payload.image
  }
}
