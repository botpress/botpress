import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import _ from 'lodash'
import { CHANNEL_NAME } from '../backend/constants'
import { SlackContext } from '../backend/typings'

export class SlackCarouselRenderer implements ChannelRenderer<SlackContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return SlackCarouselRenderer.name
  }

  handles(context: SlackContext): boolean {
    return !!context.payload.items?.length
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
            image_url: formatUrl(context.botUrl, card.image),
            alt_text: 'image'
          }
        },
        {
          type: 'actions',
          elements: (card.actions || []).map((btn, btnIdx) => {
            if (btn.action === sdk.ButtonAction.SaySomething || btn.action === sdk.ButtonAction.Postback) {
              return {
                type: 'button',
                action_id: 'button_clicked' + cardIdx + btnIdx,
                text: {
                  type: 'plain_text',
                  text: btn.title
                },
                value: (btn as sdk.ActionSaySomething).text || (btn as sdk.ActionPostback).payload
              }
            } else if (btn.action === sdk.ButtonAction.OpenUrl) {
              return {
                type: 'button',
                action_id: 'discard_action' + cardIdx + btnIdx,
                text: {
                  type: 'plain_text',
                  text: btn.title
                },
                url: (btn as sdk.ActionOpenURL).url.replace('BOT_URL', context.botUrl)
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
