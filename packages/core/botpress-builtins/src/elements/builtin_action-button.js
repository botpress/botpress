export default {
  id: 'builtin_action-button',
  renderer: 'builtin_action-button',

  group: 'Built-in Messages',
  title: 'Action Button',

  jsonSchema: {
    description: 'A button that triggers an action, often used in cards',
    type: 'object',
    required: ['action'],
    properties: {
      action: {
        type: 'string',
        enum: ['Say something', 'Open URL', 'Pick location'],
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
                description:
                  'This will simulate the user typing something to the bot. It is often used to reduce typing effort for the user.',
                title: 'Text'
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
          }
        ]
      }
    }
  },

  uiSchema: {},

  computePreviewText: formData => `Action: ${formData.action}`,

  computeMetadata: null
}
