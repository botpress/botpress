import * as sdk from 'botpress/sdk'
import { TwilioContext } from '../backend/typings'

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
    return context.payload.items?.length
  }

  async render(context: TwilioContext): Promise<void> {
    const payload = context.payload as sdk.CarouselContent

    for (const { subtitle, title, image, actions } of payload.items) {
      const body = `${title}\n\n${subtitle || ''}`
      const options: sdk.ChoiceOption[] = []

      for (const button of actions || []) {
        const title = button.title as string

        if (button.action === 'Open URL') {
          options.push({ title: `${title} : ${(button as sdk.ActionOpenURL).url}`, value: undefined })
        } else if (button.action === 'Postback') {
          options.push({ title, value: (button as sdk.ActionPostback).payload })
        } else if (button.action === 'Say something') {
          options.push({
            title,
            value: (button as sdk.ActionSaySomething).text as string
          })
        }
      }

      // TODO fix any not working with medial url
      context.messages.push(<any>{ body, mediaUrl: image })
      context.payload.choices = options
    }
  }
}
