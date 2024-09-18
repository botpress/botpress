import type { ChatPostMessageArguments } from '@slack/web-api'
import { channels } from '.botpress'

type Card = channels.channel.card.Card
type CardAction = channels.channel.card.Card['actions'][number]

export function renderCard(payload: Card): ChatPostMessageArguments['blocks'] {
  return [
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
            return renderButtonSay(item)
          case 'postback':
            return renderButtonPostback(item)
          case 'url':
            return renderButtonUrl(item)
          default:
            throw Error(`Unknown action type ${item.action}`)
        }
      }),
    },
  ]
}

function renderButtonUrl(action: CardAction) {
  return {
    type: 'button',
    text: {
      type: 'plain_text',
      text: action.label,
    },
    url: action.value,
  }
}

function renderButtonPostback(action: CardAction) {
  return {
    type: 'button',
    action_id: 'postback',
    text: {
      type: 'plain_text',
      text: action.label,
    },
    value: action.value,
  }
}

function renderButtonSay(action: CardAction) {
  return {
    type: 'button',
    action_id: 'say',
    text: {
      type: 'plain_text',
      text: action.label,
    },
    value: action.value,
  }
}
