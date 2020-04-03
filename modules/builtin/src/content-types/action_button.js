const base = require('./_base')

function renderElement(data, channel) {
  // We don't render action button
  return []
}

module.exports = {
  id: 'builtin_action-button',
  group: 'Built-in Messages',
  title: 'module.builtin.actionButton',

  jsonSchema: {
    description: 'module.builtin.types.actionButton.description',
    type: 'object',
    required: ['action', 'title'],
    properties: {
      title: {
        type: 'string',
        title: 'module.builtin.types.actionButton.buttonTitle'
      },
      action: {
        type: 'string',
        enum: ['Say something', 'Open URL', 'Postback'],
        default: 'Say something'
      }
    },
    dependencies: {
      action: {
        oneOf: [
          {
            properties: {
              action: {
                enum: ['Say something']
              },
              text: {
                type: 'string',
                title: 'Enter text or the ID of a content element (ex: #!builtin_text-myid)'
              }
            }
          },
          {
            properties: {
              action: {
                enum: ['Open URL']
              },
              url: {
                type: 'string',
                title: 'Enter a valid URL'
              }
            },
            required: ['url']
          },
          {
            properties: {
              action: {
                enum: ['Postback']
              },
              payload: {
                type: 'string'
              }
            },
            required: ['payload']
          }
        ]
      }
    }
  },

  uiSchema: {},

  computePreviewText: formData => `Action: ${formData.action}`,
  renderElement: renderElement,
  hidden: true
}
