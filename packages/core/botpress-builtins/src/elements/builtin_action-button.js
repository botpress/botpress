export default {
  id: 'builtin_action-button',
  renderer: '#builtin_action-button',

  group: 'Built-in Messages',
  title: 'Action Button',

  jsonSchema: {
    description: 'A button that triggers an action, often used in cards',
    type: 'object',
    required: ['action', 'title'],
    properties: {
      title: {
        type: 'string',
        description: 'Title of the button'
      },
      action: {
        type: 'string',
        enum: ['Say something', 'Open URL', 'Click-to-Call', 'Share', 'Pick location'],
        default: 'Say something'
      }
    },
    dependencies: {
      action: {
        oneOf: [
          {
            properties: {
              action: {
                enum: ['Pick location', 'Share']
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
              },
              webview_height_ratio: {
                type: 'string',
                title: 'Webview Height',
                enum: ['compact', 'tall', 'full'],
                default: 'tall'
              },
              messenger_extensions: {
                type: 'boolean',
                title: 'Messenger Extensions',
                default: true
              }
            },
            required: ['url']
          },
          {
            properties: {
              action: {
                enum: ['Click-to-Call']
              },
              phone_number: {
                type: 'string',
                title: 'Enter a valid Phone Number'
              }
            },
            required: ['phone_number']
          },
          {
            properties: {
              action: {
                enum: ['Say something']
              },
              text: {
                type: 'string',
                title: 'Enter the text template for the Postback Payload'
              }
            },
            required: ['text']
          }
        ]
      }
    }
  },

  uiSchema: {
    action: {
      text: {
        'ui:widget': 'textarea',
        'ui:help': 'This text content will be sent via postback event',
        'ui:options': {
          rows: 3
        }
      },
      phone_number: {
        'ui:help': 'Include "+" prefix, country code, area code and local number: +16505551234'
      }
    }
  },

  computePreviewText: formData => `Action: ${formData.title} [${formData.action}]`,

  computeMetadata: null
}
