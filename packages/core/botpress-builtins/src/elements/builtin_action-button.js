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
                enum: ['Say something', 'Pick location']
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
