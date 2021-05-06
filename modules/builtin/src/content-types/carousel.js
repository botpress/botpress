const base = require('./_base')
const Card = require('./card')
const utils = require('./_utils')

function render(data) {
  const events = []

  if (data.typing) {
    events.push({
      type: 'typing',
      value: data.typing
    })
  }

  return [
    ...events,
    {
      text: ' ',
      type: 'carousel',
      collectFeedback: data.collectFeedback,
      elements: data.items.map(card => ({
        title: card.title,
        picture: card.image ? utils.formatURL(data.BOT_URL, card.image) : null,
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
              url: a.url && a.url.replace('BOT_URL', data.BOT_URL)
            }
          } else if (a.action === 'Postback') {
            return {
              type: 'postback',
              title: a.title,
              payload: a.payload
            }
          } else {
            throw new Error(`Webchat carousel does not support "${a.action}" action-buttons at the moment`)
          }
        })
      }))
    }
  ]
}

function renderMessenger(data) {
  const renderElements = data => {
    if (data.items.find(({ actions }) => !actions || actions.length === 0)) {
      throw new Error('Channel-Messenger carousel does not support cards without actions')
    }

    return data.items.map(card => ({
      title: card.title,
      image_url: card.image ? utils.formatURL(data.BOT_URL, card.image) : null,
      subtitle: card.subtitle,
      buttons: (card.actions || []).map(a => {
        if (a.action === 'Say something') {
          throw new Error('Channel-Messenger carousel does not support "Say something" action-buttons at the moment')
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
        } else {
          throw new Error(`Channel-Messenger carousel does not support "${a.action}" action-buttons at the moment`)
        }
      })
    }))
  }

  const events = []

  if (data.typing) {
    events.push({
      type: 'typing',
      value: data.typing
    })
  }

  return [
    ...events,
    {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: renderElements(data)
        }
      }
    }
  ]
}

function renderElement(data, channel) {
  // These channels now use channel renderers
  if (['telegram', 'twilio', 'slack', 'smooch'].includes(channel)) {
    return utils.extractPayload('carousel', data)
  }

  if (channel === 'messenger') {
    return renderMessenger(data)
  } else {
    return render(data)
  }
}

module.exports = {
  id: 'builtin_carousel',
  group: 'Built-in Messages',
  title: 'module.builtin.types.carousel.title',

  jsonSchema: {
    description: 'module.builtin.types.carousel.description',
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        title: 'module.builtin.types.carousel.cards',
        items: Card.jsonSchema
      },
      ...base.typingIndicators
    }
  },
  computePreviewText: formData => formData.items && `Carousel: (${formData.items.length}) ${formData.items[0].title}`,
  renderElement: renderElement
}
