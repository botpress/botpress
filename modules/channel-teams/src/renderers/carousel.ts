import { AttachmentLayoutTypes, CardFactory } from 'botbuilder'
import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/constants'
import { TeamsContext } from '../backend/typings'

export class TeamsCarouselRenderer implements ChannelRenderer<TeamsContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return TeamsCarouselRenderer.name
  }

  handles(context: TeamsContext): boolean {
    return !!context.payload.items?.length
  }

  render(context: TeamsContext) {
    const payload = context.payload as sdk.CarouselContent

    context.messages.push({
      type: 'message',
      attachments: payload.items.map(card => {
        const contentUrl = formatUrl(context.botUrl, card.image)

        return CardFactory.heroCard(
          // TODO: what about the subtitle?
          card.title as string,
          CardFactory.images([contentUrl]),
          CardFactory.actions(
            card.actions.map(button => {
              if (button.action === sdk.ButtonAction.OpenUrl) {
                const url = (button as sdk.ActionOpenURL).url.replace('BOT_URL', context.botUrl)
                return {
                  type: 'openUrl',
                  value: url,
                  title: button.title
                }
              } else if (button.action === sdk.ButtonAction.SaySomething) {
                const say = (button as sdk.ActionSaySomething).text as string
                return {
                  type: 'messageBack',
                  title: button.title,
                  value: say,
                  text: say,
                  displayText: say
                }
              } else if (button.action === sdk.ButtonAction.Postback) {
                const payload = (button as sdk.ActionPostback).payload
                return {
                  type: 'messageBack',
                  title: button.title,
                  value: payload,
                  text: payload
                }
              }
            })
          )
        )
      }),
      attachmentLayout: AttachmentLayoutTypes.Carousel
    })
  }
}
