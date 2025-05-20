import type { ChatPostMessageArguments } from '@slack/web-api'
import { channels } from '.botpress'

type Card = channels.channel.card.Card
type CardAction = channels.channel.card.Card['actions'][number]

export const renderCard = (payload: Card): ChatPostMessageArguments['blocks'] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${payload.title}*\n${payload.subtitle}`,
    },
    accessory: payload.imageUrl
      ? {
          type: 'image',
          image_url: payload.imageUrl,
          alt_text: 'image',
        }
      : undefined,
  },
  {
    type: 'actions',
    elements: payload.actions.map((item) => {
      switch (item.action) {
        case 'say':
          return _renderButtonSay(item)
        case 'postback':
          return _renderButtonPostback(item)
        case 'url':
          return _renderButtonUrl(item)
        default:
          item.action satisfies never
          throw Error(`Unknown action type ${item.action}`)
      }
    }),
  },
]

const _renderButtonUrl = (action: CardAction) => ({
  type: 'button',
  text: {
    type: 'plain_text',
    text: action.label,
  },
  url: action.value,
})

const _renderButtonPostback = (action: CardAction) => ({
  type: 'button',
  action_id: 'postback',
  text: {
    type: 'plain_text',
    text: action.label,
  },
  value: action.value,
})

const _renderButtonSay = (action: CardAction) => ({
  type: 'button',
  action_id: 'say',
  text: {
    type: 'plain_text',
    text: action.label,
  },
  value: action.value,
})
