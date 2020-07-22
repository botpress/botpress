import * as sdk from 'botpress/sdk'

export const convertPayload = (data: sdk.Content.All) => {
  const { metadata, extraProps } = data
  const botUrl = extraProps?.BOT_URL

  const common = {
    collectFeedback: metadata?.__collectFeedback,
    metadata
  }

  if (data.type === 'image') {
    return {
      type: 'file',
      title: data.title,
      url: `${botUrl}${data.image}`,
      ...common
    }
  } else if (data.type === 'carousel') {
    return {
      text: ' ',
      type: 'carousel',
      ...common,
      elements: data.items.map(({ title, image, subtitle, actions }) => ({
        title,
        subtitle,
        picture: image ? `${botUrl}${image}` : eval('null'),
        buttons: (actions || []).map(a => {
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
              url: a.url?.replace('BOT_URL', botUrl)
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
