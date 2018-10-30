const base = require('./_base.js')

function renderForWeb(data) {
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
      on: 'webchat',
      text: data.text,
      quick_replies: data.choices.map(c => ({
        title: c.title,
        payload: c.value.toUpperCase()
      })),
      typing: data.typing
    }
  ]
}

function renderElement(data, channel) {
  if (channel === 'web') {
    return renderForWeb(data)
  }

  return [] // TODO Handle channel not supported
}

module.exports = {
  id: 'builtin_single-choice',
  group: 'Built-in Messages',
  title: 'Single Choice',

  jsonSchema: {
    description: 'Suggest choices to the user with the intention of picking only one (with an optional message)',
    type: 'object',
    required: ['choices'],
    properties: {
      text: {
        type: 'string',
        title: 'Message'
      },
      choices: {
        type: 'array',
        title: 'Choices',
        minItems: 1,
        maxItems: 10,
        items: {
          type: 'object',
          required: ['title', 'value'],
          properties: {
            title: {
              description: 'The title of the choice (this is what gets shown to the user)',
              type: 'string',
              title: 'Message'
            },
            value: {
              description:
                'The value that your bot gets when the user picks this choice (usually hidden from the user)',
              type: 'string',
              title: 'Value'
            }
          }
        }
      },
      ...base.typingIndicators
    }
  },

  uiSchema: {
    variations: {
      'ui:options': {
        orderable: false
      }
    }
  },

  computePreviewText: formData => `Choices (${formData.choices.length}) ${formData.text}`,
  renderElement: renderElement
}
