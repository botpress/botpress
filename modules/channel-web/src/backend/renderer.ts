import * as sdk from 'botpress/sdk'

export const convertPayload = (data: sdk.Content.All) => {
  const botUrl = data.extraProps?.BOT_URL

  if (data.type === 'image') {
    return {
      type: 'file',
      title: data.title,
      url: `${botUrl}${data.image}`,
      collectFeedback: data.metadata.collectFeedback
    }
  } else if (data.type === 'carousel') {
    return {
      text: ' ',
      type: 'carousel',
      collectFeedback: data.metadata.collectFeedback,
      elements: data.items.map(card => ({
        title: card.title,
        picture: card.image ? `${botUrl}${card.image}` : eval('null'),
        subtitle: card.subtitle,
        buttons: (card.actions || []).map(a => {
          if (a.action === 'Say something') {
            return {
              type: 'say_something',
              title: a.title,
              text: a.text
            }
          } else if (a.action === 'Open URL') {
            return {
              type: 'open_url',
              title: a.title,
              url: a.url && a.url.replace('BOT_URL', botUrl)
            }
          } else if (a.action === 'Postback') {
            return {
              type: 'postback',
              title: a.title,
              payload: a.payload
            }
          } else {
            throw new Error(`Webchat carousel does not support "${a['action']}" action-buttons at the moment`)
          }
        })
      }))
    }
  }

  return data
}
