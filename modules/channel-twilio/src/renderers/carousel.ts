import * as sdk from 'botpress/sdk'
import { MessageOption, TwilioContext } from 'src/backend/typings'
import { TwilioBaseRenderer } from './base'

export class TwilioCarouselRenderer extends TwilioBaseRenderer {
  getId() {
    return TwilioCarouselRenderer.name
  }

  getPayloadType(): string {
    return 'carousel'
  }

  async render(context: TwilioContext): Promise<boolean> {
    const payload = context.event.payload as sdk.CarouselContent

    for (const { subtitle, title, image, actions } of payload.items) {
      const body = `${title}\n\n${subtitle ? subtitle : ''}`

      const options: MessageOption[] = []
      for (const button of actions || []) {
        const title = button.title as string

        if (button.action === 'Open URL') {
          options.push({ label: `${title} : ${(button as sdk.ActionOpenURL).url}`, value: undefined, type: 'url' })
        } else if (button.action === 'Postback') {
          options.push({ label: title, value: (button as sdk.ActionPostback).payload, type: 'postback' })
        } else if (button.action === 'Say something') {
          options.push({
            label: title,
            value: (button as sdk.ActionSaySomething).text as string,
            type: 'say_something'
          })
        }
      }

      const args = { mediaUrl: image ? image : undefined }
      await context.args.sendOptions(context.event, body, args, options)
    }

    return true
  }
}
