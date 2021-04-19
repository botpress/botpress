import * as sdk from 'botpress/sdk'
import { TwilioContext } from 'src/backend/typings'
import { TwilioBaseRenderer } from './base'

export class TwilioImageRenderer extends TwilioBaseRenderer {
  getId() {
    return TwilioImageRenderer.name
  }

  getPayloadType(): string {
    return 'image'
  }

  async render(context: TwilioContext): Promise<boolean> {
    const payload = context.event.payload as sdk.ImageContent

    await context.args.sendMessage(context.event, {
      body: payload.title,
      mediaUrl: payload.image
    })

    return true
  }
}
