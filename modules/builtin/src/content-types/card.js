const ActionButton = require('./action_button')
const Carousel = require('./carousel')

module.exports = {
  id: 'builtin_card',
  group: 'Built-in Messages',
  title: 'card',

  jsonSchema: {
    description: 'module.builtin.types.card.description',
    type: 'object',
    required: ['title'],
    properties: {
      title: {
        type: 'string',
        title: 'title'
      },
      subtitle: {
        type: 'string',
        title: 'subtitle'
      },
      image: {
        type: 'string',
        $subtype: 'media',
        $filter: '.jpg, .png, .jpeg, .gif, .bmp, .tif, .tiff|image/*',
        title: 'image'
      },
      actions: {
        type: 'array',
        title: 'module.builtin.actionButton',
        items: ActionButton.jsonSchema
      }
    }
  },

  uiSchema: {
  },

  newSchema: {
    advancedSettings: [
      {
        key: 'markdown',
        label: 'Use Markdown',
        type: 'checkbox',
        moreInfo: {
          label: 'Learn more',
          url: 'https://daringfireball.net/projects/markdown/'
        }
      },
      {
        key: 'typingIndicator',
        type: 'checkbox',
        label: 'Display typing indicator'
      }
    ],
    fields: [
      {
        type: 'upload',
        key: 'image',
        label: 'Upload Image'
      },
      {
        type: 'text',
        key: 'title',
        label: 'Title',
        placeholder: 'What is your card subject?'
      },
      {
        type: 'text',
        key: 'text',
        label: 'Text',
        placeholder: 'Optional'
      },
      {
        group: {
          addLabel: 'Add Button',
          contextMenu: [
            {
              type: 'delete',
              label: 'Delete Button'
            }
          ]
        },
        type: 'group',
        key: 'buttons',
        label: 'fields::buttonText',
        fields: [
          {
            type: 'text',
            key: 'buttonText',
            label: 'Button Text',
            placeholder: 'What is written on the button?'
          },
          {
            type: 'select',
            key: 'action',
            label: 'Button Action',
            options: [
              {
                value: 'say',
                label: 'Say',
                related: {
                  placeholder: 'What will your chatbot say ?',
                  type: 'text',
                  key: 'text',
                  label: 'Text'
                }
              },
              {
                value: 'openUrl',
                label: 'Open Url',
                related: {
                  placeholder: 'Write a valid URL',
                  type: 'url',
                  key: 'text',
                  label: 'URL'
                }
              },
              {
                value: 'postBack',
                label: 'Post Back',
                related: {
                  type: 'textarea',
                  key: 'text',
                  label: 'Payload'
                }
              }
            ]
          }
        ]
      }
    ]
  },

  computePreviewText: formData => formData.title && `Card: ${formData.title}`,
  renderElement: (data, channel) => Carousel.renderElement({ items: [data], ...data }, channel)
}
