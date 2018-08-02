const base = require('./_base.js')

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
  computeData: (typeId, formData) => formData,
  renderElement: data => [
    {
      // on: '*',
      text: data.text,
      typing: data.typing,
      markdown: true // Webchat only
    }
  ]
}
