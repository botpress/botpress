const base = require('./_base.js')

function render(data) {
  return {
    type: 'text',
    markdown: true,
    text: data.text
  }
}

function renderForWeb(data) {
  const events = []

  if (data.typing) {
    events.push({
      type: 'typing',
      value: data.typing
    })
  }

  return [...events, render(data)]
}

function renderForApi(data) {
  return [render(data)]
}

function renderElement(data, channel) {
  if (channel === 'web') {
    return renderForWeb(data)
  } else if (channel === 'api') {
    return renderForApi(data)
  }

  return [] // TODO
}

module.exports = {
  id: 'builtin_text',
  group: 'Built-in Messages',
  title: 'Text',

  jsonSchema: {
    description: 'A regular text message with optional typing indicators and alternates',
    type: 'object',
    required: ['text'],
    properties: {
      text: {
        type: 'string',
        title: 'Message'
      },
      variations: {
        type: 'array',
        title: 'Alternates (optional)',
        items: {
          type: 'string',
          default: ''
        }
      },
      ...base.typingIndicators
    }
  },

  uiSchema: {
    text: {
      'ui:widget': 'textarea'
    },
    variations: {
      'ui:options': {
        orderable: false
      }
    }
  },

  computePreviewText: formData => 'Text: ' + formData.text,
  renderElement: renderElement
}
