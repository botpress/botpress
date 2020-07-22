import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export const convertPayload = (data: sdk.Content.All) => {
  const botUrl = data.extraProps?.BOT_URL

  if (data.type === 'image') {
    return [
      {
        type: 'image',
        title: data.title && {
          type: 'plain_text',
          text: data.title
        },
        image_url: `${botUrl}${data.image}`,
        alt_text: 'image'
      }
    ]
  } else if (data.type === 'carousel') {
    return _.flatten(
      data.items.map((card, cardIdx) => [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${card.title}*\n${card.subtitle}`
          },
          accessory: card.image?.length
            ? {
                type: 'image',
                image_url: `${botUrl}${card.image}`,
                alt_text: 'image'
              }
            : undefined
        },
        {
          type: 'actions',
          elements: (card.actions || []).map((btn, btnIdx) => {
            if (btn.action === 'Say something') {
              return {
                type: 'button',
                action_id: `button_clicked${cardIdx}${btnIdx}`,
                text: {
                  type: 'plain_text',
                  text: btn.title
                }
              }
            } else if (btn.action === 'Postback') {
              return {
                type: 'button',
                action_id: `button_clicked${cardIdx}${btnIdx}`,
                text: {
                  type: 'plain_text',
                  text: btn.title
                },
                value: btn.payload
              }
            } else if (btn.action === 'Open URL') {
              return {
                type: 'button',
                action_id: `discard_action${cardIdx}${btnIdx}`,
                text: {
                  type: 'plain_text',
                  text: btn.title
                },
                url: btn.url?.replace('BOT_URL', botUrl) ?? ''
              }
            } else {
              throw new Error(`Slack carousel does not support "${btn['action']}" action-buttons at the moment`)
            }
          })
        }
      ])
    )
  }

  return []
}
