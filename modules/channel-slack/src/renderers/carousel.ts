import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { SlackContext } from '../backend/typings'

export class SlackCarouselRenderer implements sdk.ChannelRenderer<SlackContext> {
  get channel(): string {
    return 'slack'
  }

  get priority(): number {
    return 0
  }

  get id() {
    return SlackCarouselRenderer.name
  }

  handles(context: SlackContext): boolean {
    return context.payload.items
  }

  render(context: SlackContext) {
    const payload = context.payload as sdk.CarouselContent

    context.message.blocks.push(
      ..._.flatMap(payload.items, (card, cardIdx) => [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${card.title}*\n${card.subtitle}`
          },
          accessory: card.image && {
            type: 'image',
            image_url: card.image,
            alt_text: 'image'
          }
        },
        {
          type: 'actions',
          elements: (card.actions || []).map((btn, btnIdx) => {
            if (btn.action === 'Say something' || btn.action === 'Postback') {
              return {
                type: 'button',
                action_id: 'button_clicked' + cardIdx + btnIdx,
                text: {
                  type: 'plain_text',
                  text: btn.title
                },
                value: (btn as sdk.ActionSaySomething).text || (btn as sdk.ActionPostback).payload
              }
            } else if (btn.action === 'Open URL') {
              return {
                type: 'button',
                action_id: 'discard_action' + cardIdx + btnIdx,
                text: {
                  type: 'plain_text',
                  text: btn.title
                },
                url: (btn as sdk.ActionOpenURL).url
              }
            } else {
              throw new Error(`Slack carousel does not support "${btn.action}" action-buttons at the moment`)
            }
          })
        }
      ])
    )
  }
}
