import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/client'
import { VonageContext } from '../backend/typings'

export class VonageCarouselRenderer implements ChannelRenderer<VonageContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return VonageCarouselRenderer.name
  }

  handles(context: VonageContext): boolean {
    return !!context.payload.items?.length
  }

  render(context: VonageContext) {
    const payload = context.payload as sdk.CarouselContent
    let lastOptions: sdk.ChoiceOption[]

    // We down render carousel to text so it works with whatsapp
    for (const { subtitle, title, image, actions } of payload.items) {
      let body = `${title}\n\n${subtitle || ''}`
      const options: sdk.ChoiceOption[] = []

      for (const button of actions || []) {
        const title = button.title as string

        if (button.action === sdk.ButtonAction.OpenUrl) {
          options.push({
            title: `${title} : ${(button as sdk.ActionOpenURL).url.replace('BOT_URL', context.botUrl)}`,
            value: undefined
          })
        } else if (button.action === sdk.ButtonAction.Postback) {
          options.push({ title, value: (button as sdk.ActionPostback).payload })
        } else if (button.action === sdk.ButtonAction.SaySomething) {
          options.push({
            title,
            value: (button as sdk.ActionSaySomething).text as string
          })
        }
      }

      body = `${body}\n\n${options.map(({ title }, idx) => `*(${idx + 1})* ${title}`).join('\n')}`

      if (image) {
        context.messages.push({
          content: {
            type: 'image',
            text: undefined,
            image: {
              url: formatUrl(context.botUrl, image),
              caption: body
            }
          }
        })
      } else {
        context.messages.push({
          content: {
            type: 'text',
            text: body
          }
        })
      }

      lastOptions = options
    }

    if (lastOptions) {
      context.prepareIndexResponse(context.event, lastOptions)
    }
  }
}
