const base = require('./_base')
const Card = require('./card')

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
        picture: card.image ? `${data.BOT_URL}${card.image}` : null,
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
      image_url: card.image ? `${data.BOT_URL}${card.image}` : null,
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
  if (channel === 'web' || channel === 'slack') {
    return base.renderer(data, 'carousel')
  } else if (channel === 'messenger') {
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
  newSchema: {
    displayedIn: ['qna', 'sayNode'],
    advancedSettings: [
      {
        key: 'markdown',
        label: 'module.builtin.useMarkdown',
        defaultValue: true,
        type: 'checkbox',
        moreInfo: {
          label: 'learnMore',
          url: 'https://daringfireball.net/projects/markdown/'
        }
      },
      {
        key: 'typing',
        defaultValue: true,
        type: 'checkbox',
        label: 'module.builtin.typingIndicator'
      }
    ],
    fields: [
      {
        group: {
          addLabel: 'module.builtin.types.card.add',
          minimum: 1,
          contextMenu: [
            {
              type: 'delete',
              label: 'module.builtin.types.card.delete'
            }
          ]
        },
        type: 'group',
        key: 'items',
        label: 'fields::title',
        fields: Card.newSchema && Card.newSchema.fields
      }
    ]
  },
  computePreviewText: formData => formData.items && `Carousel: (${formData.items.length}) ${formData.items[0].title}`,
  renderElement: renderElement
}
