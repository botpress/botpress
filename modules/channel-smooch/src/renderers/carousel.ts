import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/constants'
import { Card, SmoochContext } from '../backend/typings'

export class SmoochCarouselRenderer implements ChannelRenderer<SmoochContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return SmoochCarouselRenderer.name
  }

  handles(context: SmoochContext): boolean {
    return !!context.payload.items?.length
  }

  async render(context: SmoochContext) {
    const payload = context.payload as sdk.CarouselContent

    const cards = []
    for (const bpCard of payload.items) {
      const card: Card = {
        title: bpCard.title as string,
        description: bpCard.subtitle as string,
        actions: []
      }

      // Smooch crashes if mediaUrl is defined but has no value
      if (bpCard.image) {
        card.mediaUrl = formatUrl(context.botUrl, bpCard.image)
      }

      for (const button of bpCard.actions || []) {
        if (button.action === sdk.ButtonAction.OpenUrl) {
          card.actions.push({
            text: button.title,
            type: 'link',
            uri: (button as sdk.ActionOpenURL).url.replace('BOT_URL', context.botUrl)
          })
        } else if (button.action === sdk.ButtonAction.Postback) {
          // This works but postback doesn't do anything
          card.actions.push({
            text: button.title,
            type: 'postback',
            payload: (button as sdk.ActionPostback).payload
          })
        } /* else if (bpAction.type === 'say_something') {
          card.actions.push({
            text: bpAction.title,
            type: 'reply',
            payload: bpAction.text
          })
        }*/
      }

      if (card.actions.length === 0) {
        // Smooch crashes if this list is empty or undefined. However putting this dummy
        // card in seems to produce the expected result (that is seeing 0 actions)
        card.actions.push({
          text: '',
          type: 'postback',
          payload: ''
        })
      }

      cards.push(card)
    }

    context.messages.push({ type: 'carousel', items: cards })
  }
}
