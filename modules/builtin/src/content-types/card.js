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

  uiSchema: {},

  newSchema: {
    displayedIn: ['qna', 'sayNode'],
    order: 2,
    fields: {
      image: {
        type: 'file',
        label: 'module.builtin.types.image.uploadImage'
      },
      title: {
        type: 'string',
        label: 'title',
        translatable: true,
        placeholder: 'module.builtin.types.card.cardSubject'
      },
      subtitle: {
        type: 'string',
        label: 'text',
        translatable: true,
        placeholder: 'optional'
      },
      actions: {
        type: 'group',
        label: 'fields::title',
        addLabel: 'module.builtin.types.actionButton.addButton',
        contextMenu: [
          {
            type: 'delete',
            label: 'module.builtin.types.actionButton.delete'
          }
        ],
        fields: {
          title: {
            type: 'string',
            superInput: true,
            translatable: true,
            label: 'module.builtin.types.actionButton.textLabel',
            placeholder: 'module.builtin.types.actionButton.textPlaceholder'
          },
          action: {
            type: 'enum',
            defaultValue: 'Say something',
            label: 'module.builtin.types.actionButton.actionLabel',
            options: [
              {
                value: 'Say something',
                label: 'module.builtin.types.actionButton.sayLabel',
                related: {
                  placeholder: 'module.builtin.types.actionButton.sayPlaceholder',
                  type: 'text',
                  key: 'text',
                  label: 'module.builtin.types.actionButton.sayTextLabel',
                  translatable: true,
                  superInput: true
                }
              },
              {
                value: 'Open URL',
                label: 'module.builtin.types.actionButton.urlLabel',
                related: {
                  placeholder: 'module.builtin.types.actionButton.urlPlaceholder',
                  type: 'url',
                  key: 'url',
                  label: 'URL',
                  superInput: true
                }
              },
              {
                value: 'Postback',
                label: 'module.builtin.types.actionButton.postLabel',
                related: {
                  key: 'payload',
                  type: 'textarea',
                  label: 'module.builtin.types.actionButton.postFieldLabel',
                  superInput: true
                }
              }
            ]
          }
        }
      }
    }
  },

  computePreviewText: formData => formData.title && `Card: ${formData.title}`,
  renderElement: (data, channel) => Carousel.renderElement({ items: [data], ...data }, channel)
}
