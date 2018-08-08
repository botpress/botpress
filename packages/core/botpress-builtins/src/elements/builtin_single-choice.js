import * as base from './builtin_base_properties'

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
      text: {
        type: 'string',
        title: 'Message'
      },
      choices: {
        type: 'array',
        title: 'Choices',
        description:
          'Protip: To prevent an element from being rendered on the channel, prefix either the Title or the Value with `!hide `',
        minItems: 1,
        maxItems: 10,
        items: {
          type: 'object',
          required: ['title', 'value'],
          properties: {
            title: {
              description: 'The title of the choice (this is what gets shown to the user)',
              type: 'string',
              title: 'Message'
            },
            value: {
              description:
                'The value that your bot gets when the user picks this choice (usually hidden from the user)',
              type: 'string',
              title: 'Value'
            }
          }
        }
      },
      ...base.typingIndicators
    }
  },

  uiSchema: {
    variations: {
      'ui:options': {
        orderable: false
      }
    }
  },

  computePreviewText: formData => `Choices (${formData.choices.length}) ${formData.text}`,
  computeMetadata: null
}
