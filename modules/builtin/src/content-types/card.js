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
    displayedIn: ['qna', 'sayNode'],
    advancedSettings: [
      {
        key: 'markdown',
        defaultValue: true,
        label: 'module.builtin.useMarkdown',
        type: 'checkbox',
        moreInfo: {
          label: 'learnMore',
          url: 'https://daringfireball.net/projects/markdown/'
        }
      },
      {
        key: 'typing',
        defaultValue: true,
        type: 'checkbox',
        label: 'module.builtin.typingIndicator'
      }
    ],
    fields: [
      {
        type: 'upload',
        key: 'image',
        label: 'module.builtin.types.image.uploadImage'
      },
      {
        type: 'text',
        key: 'title',
        label: 'title',
        superInput: true,
        placeholder: 'module.builtin.types.card.cardSubject'
      },
      {
        type: 'text',
        key: 'subtitle',
        label: 'text',
        superInput: true,
        placeholder: 'module.builtin.optional'
      },
      {
        group: {
          addLabel: 'module.builtin.actionButton',
          contextMenu: [
            {
              type: 'delete',
              label: 'module.builtin.types.actionButton.delete'
            }
          ]
        },
        type: 'group',
        key: 'items',
        renderType: 'buttons',
        label: 'fields::title',
        fields: [
          {
            type: 'text',
            key: 'title',
            superInput: true,
            label: 'module.builtin.types.actionButton.textLabel',
            placeholder: 'module.builtin.types.actionButton.textPlaceholder'
          },
          {
            type: 'select',
            defaultValue: 'say',
            key: 'action',
            label: 'module.builtin.types.actionButton.actionLabel',
            options: [
              {
                value: 'say',
                label: 'module.builtin.types.actionButton.sayLabel',
                related: {
                  placeholder: 'module.builtin.types.actionButton.sayPlaceholder',
                  type: 'text',
                  key: 'text',
                  superInput: true,
                  label: 'module.builtin.types.actionButton.sayTextLabel'
                }
              },
              {
                value: 'openUrl',
                label: 'module.builtin.types.actionButton.urlLabel',
                related: {
                  placeholder: 'module.builtin.types.actionButton.urlPlaceholder',
                  type: 'url',
                  key: 'text',
                  superInput: true,
                  label: 'URL'
                }
              },
              {
                value: 'postBack',
                label: 'module.builtin.types.actionButton.postLabel',
                related: {
                  type: 'textarea',
                  key: 'text',
                  superInput: true,
                  label: 'module.builtin.types.actionButton.postFieldLabel'
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
