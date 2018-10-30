const ActionButton = require('./builtin_action_button.js')

module.exports = {
  id: 'builtin_card',
  group: 'Built-in Messages',
  title: 'Card',

  jsonSchema: {
    description: 'A card message with a title with optional subtitle, image and action buttons.',
    type: 'object',
    required: ['title'],
    properties: {
      title: {
        type: 'string',
        title: 'Title'
      },
      subtitle: {
        type: 'string',
        title: 'Subtitle'
      },
      image: {
        type: 'string',
        $subtype: 'media',
        $filter: '.jpg, .png, .jpeg, .gif, .bmp, .tif, .tiff|image/*',
        title: 'Image'
      },
      actions: {
        type: 'array',
        title: 'Action Buttons',
        items: ActionButton.jsonSchema
      }
    }
  },

  uiSchema: {
    title: {
      'ui:widget': 'textarea'
    },
    subtitle: {
      'ui:widget': 'textarea'
    }
  },

  computePreviewText: formData => `Card: ${formData.title}`,
  renderElement: (data, channel) => Carousel([data], channel)
}
