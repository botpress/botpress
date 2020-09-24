const base = require('./_base')

function render(data) {
  const events = []

  if (data.typing) {
    events.push({
      type: 'typing',
      value: data.typing
    })
  }

  return [
    ...events,
    {
      text: data.text,
      quick_replies: data.choices.map(c => ({
        title: c.title,
        payload: c.value.toUpperCase()
      })),
      typing: data.typing,
      markdown: data.markdown
    }
  ]
}

function renderer(data) {
  const payload = base.renderer(data, 'text')

  return {
    ...payload,
    metadata: {
      ...payload.metadata
    }
  }
}

function renderElement(data, channel) {
  if (['web', 'slack', 'teams', 'messenger', 'telegram', 'twilio'].includes(channel)) {
    return renderer(data)
  } else {
    return render(data)
  }
}

module.exports = {
  id: 'builtin_single-choice',
  group: 'Built-in Messages',
  title: 'suggestions',

  jsonSchema: {
    description: 'module.builtin.types.singleChoice.description',
    type: 'object',
    required: ['choices'],
    properties: {
      text: {
        type: 'string',
        title: 'message'
      },
      choices: {
        type: 'array',
        title: 'module.builtin.types.singleChoice.choice',
        minItems: 1,
        maxItems: 10,
        items: {
          type: 'object',
          required: ['title', 'value'],
          properties: {
            title: {
              description: 'module.builtin.types.singleChoice.itemTitle',
              type: 'string',
              title: 'Message'
            },
            value: {
              description: 'module.builtin.types.singleChoice.itemValue',
              type: 'string',
              title: 'Value'
            }
          }
        }
      },
      markdown: {
        type: 'boolean',
        title: 'module.builtin.useMarkdown',
        default: true
      },
      ...base.typingIndicators
    }
  },

  uiSchema: {
    text: {
      'ui:field': 'i18n_field'
    },
    choices: {
      'ui:field': 'i18n_array'
    }
  },

  newSchema: {
    displayedIn: ['qna', 'sayNode'],
    order: 4,
    advancedSettings: [
      {
        key: 'position',
        label: 'module.builtin.types.suggestions.position',
        type: 'select',
        defaultValue: 'static',
        options: [
          { label: 'module.builtin.types.suggestions.staticMenu', value: 'static' },
          { label: 'module.builtin.types.suggestions.inConversation', value: 'conversation' }
        ]
      },
      {
        key: 'expiryPolicy',
        label: 'module.builtin.types.suggestions.expiryPolicy',
        type: 'select',
        defaultValue: 'turn',
        options: [
          {
            label: 'module.builtin.types.suggestions.numberOfTurns',
            value: 'turn',
            related: {
              key: 'turnCount',
              defaultValue: 0,
              type: 'number',
              label: 'module.builtin.types.suggestions.numberOfTurnsExpire'
            }
          },
          { label: 'module.builtin.types.suggestions.endOfWorkflow', value: 'workflow' }
        ]
      }
    ],
    fields: [
      {
        key: 'text',
        type: 'text',
        label: 'message'
      },
      {
        key: 'suggestions',
        type: 'tag-input',
        translated: true,
        label: 'suggestions',
        placeholder: 'studio.library.quickAddAlternative',
        group: {
          addLabel: 'studio.flow.node.addSuggestion',
          addLabelTooltip: 'studio.flow.node.addSuggestionTooltip'
        }
      }
    ]
  },
  computePreviewText: formData =>
    formData.choices && formData.text && `Choices (${formData.choices.length}) ${formData.text}`,
  renderElement: renderElement,
  hidden: true
}
