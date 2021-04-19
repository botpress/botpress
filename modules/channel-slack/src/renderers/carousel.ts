import { ChatPostMessageArguments } from '@slack/web-api'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { SlackContext } from 'src/backend/typings'
import { SlackBaseRenderer } from './base'

export class SlackCarouselRenderer extends SlackBaseRenderer {
  getId() {
    return SlackCarouselRenderer.name
  }

  getPayloadType(): string {
    return 'carousel'
  }

  async render(context: SlackContext): Promise<boolean> {
    const payload = context.event.payload as sdk.CarouselContent

    const message: ChatPostMessageArguments = {
      channel: context.args.channelId,
      text: undefined,
      blocks: _.flatMap(payload.items, (card, cardIdx) => [
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
    }

    await context.client.web.chat.postMessage(message)

    return true
  }
}
