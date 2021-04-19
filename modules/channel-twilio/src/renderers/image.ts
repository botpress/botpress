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
    await context.args.sendMessage(context.event, {
      body: context.event.payload.title,
      mediaUrl: context.event.payload.image
    })

    return true
  }
}
