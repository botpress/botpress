const base = require('./_base')

function renderElement(data, channel) {
  // We don't render action button
  return []
}

module.exports = {
  id: 'builtin_action-button',
  group: 'Built-in Messages',
  title: {
    en: 'Action Button',
    fr: `Bouton d'action`
  },

  jsonSchema: {
    description: {
      en: 'A button that triggers an action, often used in cards',
      fr: `Un bouton qui déclenche un action, souvent utilisé dans les cartes`
    },
    type: 'object',
    required: ['action', 'title'],
    properties: {
      title: {
        type: 'string',
        title: {
          en: 'Title of the button',
          fr: 'Titre du bouton'
        }
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
