import * as base from './builtin_base_properties'
import QuickReply from './builtin_quick-reply'

export default {
  id: 'builtin_single-choice',
  renderer: '#builtin_single-choice',

  group: 'Built-in Messages',
  title: 'Single Choice',

  jsonSchema: {
    description: 'Suggest choices to the user with the intention of picking only one (with an optional message)',
    type: 'object',
    required: ['choices'],
    properties: {
      title: {
        type: 'string',
        title: 'Title'
      },
      text: {
        type: 'string',
        title: 'Message to show before the Quick Reply buttons'
      },
      choices: {
        type: 'array',
        title: 'Quick Replies',
        description:
          'Protip: To prevent an element from being rendered on the channel, prefix either the Title or the Value with `!hide `',
        minItems: 1,
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

  computePreviewText: formData => `Choices: ${formData.title} [${formData.choices.length}]`,
  computeMetadata: null
}
