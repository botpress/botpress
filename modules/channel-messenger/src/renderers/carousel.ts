import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/constants'
import { MessengerContext } from '../backend/typings'

export class MessengerCarouselRenderer implements ChannelRenderer<MessengerContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return MessengerCarouselRenderer.name
  }

  handles(context: MessengerContext): boolean {
    return !!context.payload.items?.length
  }

  render(context: MessengerContext) {
    const payload = context.payload as sdk.CarouselContent
    const cards = []

    for (const card of payload.items) {
      const buttons = []

      for (const action of card.actions || []) {
        if (action.action === sdk.ButtonAction.OpenUrl) {
          buttons.push({
            type: 'web_url',
            url: (action as sdk.ActionOpenURL).url.replace('BOT_URL', context.botUrl),
            title: action.title
          })
        } else if (action.action === sdk.ButtonAction.Postback) {
          buttons.push({
            type: 'postback',
            title: action.title,
            payload: (action as sdk.ActionPostback).payload
          })
        } else if (action.action === sdk.ButtonAction.SaySomething) {
          // TODO: not supported yet
        }
      }

      cards.push({
        title: card.title,
        image_url: card.image ? formatUrl(context.botUrl, card.image) : null,
        subtitle: card.subtitle,
        buttons
      })
    }

    context.messages.push({
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: cards
        }
      }
    })
  }
}
