import * as sdk from 'botpress/sdk'
import { TwilioContext } from 'src/backend/typings'
import { TwilioBaseRenderer } from './base'

export class TwilioTextRenderer extends TwilioBaseRenderer {
  getId() {
    return TwilioTextRenderer.name
  }

  getPayloadType(): string {
    return 'text'
  }

  async render(context: TwilioContext): Promise<boolean> {
    const payload = context.event.payload as sdk.TextContent

    await context.args.sendMessage(context.event, {
      body: payload.text
    })

    return true
  }
}
