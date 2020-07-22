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

function renderMessenger(data) {
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
        content_type: 'text',
        title: c.title,
        payload: c.value.toUpperCase()
      }))
    }
  ]
}

function renderer(data) {
  const payload = base.renderer(data, 'text')
  return {
    ...payload,
    metadata: {
      ...payload.metadata,
      __buttons: data.choices
    }
  }
}

function renderElement(data, channel) {
  if (channel === 'web' || channel === 'slack') {
    return renderer(data)
  } else if (channel === 'messenger') {
    return renderMessenger(data)
  } else {
    return render(data)
  }
}

module.exports = {
  id: 'builtin_single-choice',
  group: 'Built-in Messages',
  title: 'module.builtin.types.suggestions.title',

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
    displayedIn: [],
    advancedSettings: [
      {
        key: 'onTopOfKeyboard',
        defaultValue: true,
        type: 'checkbox',
        label: 'module.builtin.types.suggestions.displayOnTop'
      },
      {
        key: 'typing',
        defaultValue: true,
        type: 'checkbox',
        label: 'module.builtin.typingIndicator'
      },
      {
        key: 'canAdd',
        type: 'checkbox',
        label: 'module.builtin.types.suggestions.allowToAdd'
      },
      {
        key: 'multiple',
        type: 'checkbox',
        label: 'module.builtin.types.suggestions.allowMultiplePick'
      }
    ],
    fields: [
      {
        group: {
          addLabel: 'module.builtin.types.suggestions.add',
          minimum: 1,
          contextMenu: [
            {
              type: 'delete',
              label: 'module.builtin.types.suggestions.delete'
            }
          ]
        },
        type: 'group',
        key: 'choices',
        label: 'fields::title',
        fields: [
          {
            type: 'text',
            key: 'title',
            translated: true,
            label: 'module.builtin.types.suggestions.label',
            placeholder: 'module.builtin.types.suggestions.labelPlaceholder'
          },
          {
            type: 'text',
            key: 'value',
            translated: true,
            label: 'module.builtin.types.suggestions.value',
            placeholder: 'module.builtin.types.suggestions.valuePlaceholder'
          }
        ]
      }
    ]
  },
  computePreviewText: formData =>
    formData.choices && formData.text && `Choices (${formData.choices.length}) ${formData.text}`,
  renderElement: renderElement,
  hidden: true
}
