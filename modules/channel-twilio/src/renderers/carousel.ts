import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/constants'
import { TwilioContext } from '../backend/typings'

export class TwilioCarouselRenderer implements ChannelRenderer<TwilioContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return TwilioCarouselRenderer.name
  }

  handles(context: TwilioContext): boolean {
    return !!context.payload.items?.length
  }

  render(context: TwilioContext) {
    const payload = context.payload as sdk.CarouselContent

    for (const { subtitle, title, image, actions } of payload.items) {
      const body = `${title}\n\n${subtitle || ''}`
      const options: sdk.ChoiceOption[] = []

      for (const button of actions || []) {
        const title = button.title as string

        if (button.action === 'Open URL') {
          options.push({
            title: `${title} : ${(button as sdk.ActionOpenURL).url.replace('BOT_URL', context.botUrl)}`,
            value: undefined
          })
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
      context.messages.push(<any>{ body, mediaUrl: formatUrl(context.botUrl, image) })
      context.payload.choices = options
    }
  }
}
