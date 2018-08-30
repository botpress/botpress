import * as base from './builtin_base_properties'
import ActionButton from './builtin_action-button'

export default {
  id: 'builtin_raw',
  renderer: '#builtin_raw',

  group: 'Built-in Messages',
  title: 'Raw Platform Payload',

  jsonSchema: {
    description: 'Define a platform-specific message using JSON.',
    type: 'array',
    items: {
      type: 'object',
      required: ['title'],
      properties: {
        title: {
          type: 'string',
          title: 'Title'
        },
        platform: {
          type: 'string',
          title: 'Which platform?'
        },
        payload: {
          type: 'string',
          title: 'Raw payload (JSON)'
        }
      }
    }
  },

  uiSchema: {
    items: {
      title: {
        'ui:widget': 'text'
      },
      platform: {
        'ui:help': 'Tip: type "*" to fit all platforms'
      },
      payload: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 10
        }
      }
    }
  },

  computePreviewText: formData => `Raw Payload: ${formData[0].title}`,

  computeMetadata: null
}
