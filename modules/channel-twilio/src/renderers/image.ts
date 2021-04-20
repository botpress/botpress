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
    const payload = context.payload as sdk.ImageContent

    // TODO fix mediaUrl not being in typings
    context.messages.push(<any>{ body: payload.title as string, mediaUrl: payload.image })
  }
}
