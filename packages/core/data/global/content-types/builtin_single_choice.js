const base = require('./_base.js')

module.exports = {
  id: 'builtin_single-choice',
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
  computeData: (typeId, formData) => formData,
  renderElement: data => [
    {
      on: 'facebook',
      text: data.text,
      quick_replies: data.choices.map(c => `<${c.value}> ${c.title}`),
      typing: data.typing
    },
    {
      on: 'webchat',
      text: data.text,
      quick_replies: data.choices.map(c => `<${c.value}> ${c.title}`),
      typing: data.typing
    },
    {
      on: 'microsoft',
      type: 'message',
      text: data.text,
      inputHint: 'expectingInput',
      suggestedActions: {
        actions: data.choices.map(c => ({
          type: 'imBack',
          title: c.title,
          value: c.value
        }))
      }
    },
    {
      on: 'slack',
      attachments: [
        {
          text: data.text,
          attachment_type: 'default',
          actions: data.choices.map(c => ({
            name: 'press',
            text: c.title,
            type: 'button',
            value: c.value
          }))
        }
      ]
    }
  ]
}
