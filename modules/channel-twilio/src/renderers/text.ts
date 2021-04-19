import { TwilioContext } from 'src/backend/typings'
import { TwilioBaseRenderer } from './base'

export class TwilioTextRenderer extends TwilioBaseRenderer {
  getId() {
    return TwilioBaseRenderer.name
  }

  getPayloadType(): string {
    return 'text'
  }

  async render(context: TwilioContext): Promise<boolean> {
    await context.args.sendMessage(context.event, {
      body: context.event.payload.text
    })

    return true
  }
}
