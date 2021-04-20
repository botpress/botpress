import * as sdk from 'botpress/sdk'
import { MessageOption, TwilioContext } from '../backend/typings'

export class TwilioCarouselRenderer implements sdk.ChannelRenderer<TwilioContext> {
  getChannel(): string {
    return 'twilio'
  }

  getPriority(): number {
    return 0
  }

  getId(): string {
    return TwilioCarouselRenderer.name
  }

  async handles(context: TwilioContext): Promise<boolean> {
    return context.event.payload.type === 'carousel'
  }

  async render(context: TwilioContext): Promise<void> {
    const payload = context.event.payload as sdk.CarouselContent

    context.message.body = 'CAROUSEL'

    /*
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
    */
  }
}
