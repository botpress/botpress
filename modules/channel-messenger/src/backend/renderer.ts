import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export const convertPayload = (data: sdk.Content.All) => {
  const botUrl = data.extraProps?.BOT_URL

  if (data.type === 'text') {
    return {
      type: 'message',
      text: data.text
    }
  } else if (data.type === 'image') {
    return {
      attachment: {
        type: 'image',
        payload: {
          is_reusable: true,
          url: `${botUrl}${data.image}`
        }
      }
    }
  } else if (data.type === 'carousel') {
    if (data.items.find(({ actions }) => !actions || actions.length === 0)) {
      throw new Error('Channel-Messenger carousel does not support cards without actions')
    }

    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: data.items.map(card => ({
            title: card.title,
            image_url: card.image ? `${botUrl}${card.image}` : eval('null'),
            subtitle: card.subtitle,
            buttons: (card.actions || []).map(a => {
              // Instead of crashing, we treat say something like a postback
              if (a.action === 'Say something') {
                return {
                  type: 'postback',
                  title: a.title,
                  payload: a.text
                }
              } else if (a.action === 'Open URL') {
                return {
                  type: 'web_url',
                  url: a.url,
                  title: a.title
                }
              } else if (a.action === 'Postback') {
                return {
                  type: 'postback',
                  title: a.title,
                  payload: a.payload
                }
              }
            })
          }))
        }
      }
    }
  }

  return data
}
