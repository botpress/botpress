import * as base from './builtin_base_properties'
import ActionButton from './builtin_action-button'
import QuickReply from './builtin_quick-reply'

export default {
  id: 'builtin_text',
  renderer: '#builtin_text',

  group: 'Built-in Messages',
  title: 'Text',

  jsonSchema: {
    description: 'A regular text message with optional typing indicators and alternates',
    type: 'object',
    required: ['text'],
    properties: {
      label: {
        type: 'string',
        title: 'Label'
      },
      text: {
        type: 'string',
        title: 'Message'
      },
      variations: {
        type: 'array',
        title: 'Alternates (optional)',
        items: {
          type: 'string',
          default: ''
        }
      },
      actions: {
        type: 'array',
        title: 'Action Buttons',
        items: ActionButton.jsonSchema
      },
      choices: {
        type: 'array',
        title: 'Quick Replies',
        description:
          'Protip: To prevent an element from being rendered on the channel, prefix either the Title or the Value with `!hide `',
        minItems: 0,
        maxItems: 10,
        items: QuickReply.jsonSchema
      },
      ...base.typingIndicators
    }
  },

  uiSchema: {
    text: {
      'ui:widget': 'textarea'
    },
    variations: {
      'ui:options': {
        orderable: false
      }
    }
  },

  computePreviewText: formData => 'Text: ' + (formData.label || formData.text.substring(0, 40)),
  computeMetadata: null
}
