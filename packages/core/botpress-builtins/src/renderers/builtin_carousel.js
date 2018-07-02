// TODO
// Add card support to Telegram

import url from 'url'

export default data => [
  {
    on: 'facebook',
    template_type: 'generic',
    elements: data.items.map(card => ({
      title: card.title,
      image_url: card.image ? url.resolve(data.BOT_URL, card.image) : null,
      subtitle: card.subtitle,
      buttons: (card.actions || []).map(a => {
        if (a.action === 'Say something') {
          return {
            type: 'postback',
            title: a.title,
            payload: a.title
          }
        } else if (a.action === 'Open URL') {
          return {
            type: 'web_url',
            title: a.title,
            url: a.url
          }
        } else if (a.action === 'Pick location') {
          throw new Error('Messenger does not support "Pick location" action-buttons for carousels')
        }
      })
    })),

    typing: data.typing
  },
  {
    on: 'webchat',
    type: 'carousel',
    text: ' ',
    elements: data.items.map(card => ({
      title: card.title,
      picture: card.image ? url.resolve(data.BOT_URL, card.image) : null,
      subtitle: card.subtitle,
      buttons: (card.actions || []).map(a => {
        if (a.action === 'Say something') {
          throw new Error('Webchat carousel does not support "Say something" action-buttons at the moment')
        } else if (a.action === 'Open URL') {
          return {
            title: a.title,
            url: a.url
          }
        } else if (a.action === 'Pick location') {
          throw new Error('Webchat carousel does not support "Pick location" action-buttons at the moment')
        }
      })
    })),
    typing: data.typing
  },
  {
    on: 'microsoft',
    attachments: data.items.map(card => ({
      contentType: 'application/vnd.microsoft.card.hero',
      content: {
        title: card.title,
        subtitle: card.subtitle,
        images: card.image ? [{ url: url.resolve(data.BOT_URL, card.image) }] : [],
        buttons: (card.actions || []).map(a => {
          if (a.action === 'Say something') {
            return {
              type: 'imBack',
              title: a.title,
              value: a.title
            }
          } else if (a.action === 'Open URL') {
            return {
              type: 'openUrl',
              title: a.title,
              value: a.url
            }
          } else if (a.action === 'Pick location') {
            throw new Error('Microsoft carousel does not support "Pick location" action-buttons at the moment')
          }
        })
      }
    }))
  },
  {
    on: 'slack',
    attachments: data.items.map(card => ({
      title: card.title,
      image_url: card.image ? url.resolve(data.BOT_URL, card.image) : null,
      text: card.subtitle,
      actions: (card.actions || []).map(a => {
        if (a.action === 'Say something') {
          return {
            name: 'press',
            text: a.title,
            type: 'button',
            value: a.title
          }
        } else if (a.action === 'Open URL') {
          return {
            type: 'button',
            text: a.title,
            url: a.url
          }
        } else if (a.action === 'Pick location') {
          throw new Error('Slack carousel does not support "Pick location" action-buttons at the moment')
        }
      })
    }))
  }
]
