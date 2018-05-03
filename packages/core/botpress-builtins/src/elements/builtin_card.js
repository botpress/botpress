import * as base from './builtin_base_properties'
import ActionButton from './builtin_action-button'

export default {
  id: 'builtin_card',
  renderer: '#builtin_card',

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
      },
      ...base.typingIndicators
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

  computeMetadata: null
}
