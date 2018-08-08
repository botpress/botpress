module.exports = {
  id: 'builtin_action-button',
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
  computeData: (typeId, formData) => formData,
  renderElement: data => {
    if (data.action === 'Pick location') {
      throw new Error('Action-button renderers do not support "Pick location" type at the moment')
    }

    return [
      {
        on: 'facebook',
        template_type: 'generic',
        elements: [
          {
            title: data.title,
            buttons: [data.action].map(a => {
              if (a.action === 'Say something') {
                return {
                  type: 'postback',
                  title: a.title,
                  payload: a.title
                }
              } else if (a.action === 'Open URL') {
                return {
                  type: 'web_url',
                  title: a.title,
                  url: a.url
                }
              }
            })
          }
        ],

        typing: data.typing
      },
      {
        on: 'webchat',
        type: 'carousel',
        text: ' ',
        elements: [
          {
            title: data.title,
            buttons: [data.action].map(a => {
              if (a.action === 'Open URL') {
                return {
                  title: a.title,
                  url: a.url
                }
              } else {
                return {
                  title: '<Unsupported action>'
                }
              }
            })
          }
        ],
        typing: data.typing
      },
      {
        on: 'microsoft',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.hero',
            content: {
              title: data.title,
              buttons: [data.action].map(a => {
                if (a.action === 'Say something') {
                  return {
                    type: 'imBack',
                    title: a.title,
                    value: a.title
                  }
                } else if (a.action === 'Open URL') {
                  return {
                    type: 'openUrl',
                    title: a.title,
                    value: a.url
                  }
                }
              })
            }
          }
        ]
      },
      {
        on: 'slack',
        attachments: [
          {
            title: data.title,
            text: data.subtitle,
            actions: [data.action].map(a => {
              if (a.action === 'Say something') {
                return {
                  name: 'press',
                  text: a.title,
                  type: 'button',
                  value: a.title
                }
              } else if (a.action === 'Open URL') {
                return {
                  type: 'button',
                  text: a.title,
                  url: a.url
                }
              }
            })
          }
        ]
      }
    ]
  }
}
