const base = require('./_base')

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
      text: data.text,
      quick_replies: data.choices.map(c => ({
        title: c.title,
        payload: c.value.toUpperCase()
      })),
      typing: data.typing
    }
  ]
}

function renderMessenger(data) {
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
      text: data.text,
      quick_replies: data.choices.map(c => ({
        content_type: 'text',
        title: c.title,
        payload: c.value.toUpperCase()
      }))
    }
  ]
}

function renderElement(data, channel) {
  if (channel === 'web' || channel === 'api' || channel === 'telegram') {
    return render(data)
  } else if (channel === 'messenger') {
    return renderMessenger(data)
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
    text: {
      'ui:field': 'i18n_field'
    },
    choices: {
      'ui:field': 'i18n_array'
    }
  },
  computePreviewText: formData =>
    formData.choices && formData.text && `Choices (${formData.choices.length}) ${formData.text}`,
  renderElement: renderElement,
  hidden: true
}
