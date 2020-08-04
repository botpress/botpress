import { AttachmentLayoutTypes, CardFactory } from 'botbuilder'
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
      type: 'message',
      attachments: [
        {
          name: data.title,
          contentType: 'image/png',
          contentUrl: `${botUrl}${data.image}`
        }
      ]
    }
  } else if (data.type === 'carousel') {
    return {
      type: 'message',
      attachments: data.items.map(card => {
        return CardFactory.heroCard(
          card.title,
          CardFactory.images([card.image]),
          CardFactory.actions(
            card.actions.map(a => {
              if (a.action === 'Open URL') {
                return {
                  type: 'openUrl',
                  value: a.url,
                  title: a.title
                }
              } else if (a.action === 'Say something') {
                return {
                  type: 'messageBack',
                  title: a.title,
                  value: a.text,
                  text: a.text,
                  displayText: a.text
                }
              } else if (a.action === 'Postback') {
                return {
                  type: 'postBack',
                  title: a.title,
                  value: a.payload,
                  text: a.payload
                }
              }
            })
          )
        )
      }),
      attachmentLayout: AttachmentLayoutTypes.Carousel
    }
  }

  return data
}
