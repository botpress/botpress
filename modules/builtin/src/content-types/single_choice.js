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
  // hardcoded at the moment, do we want to offer this flexibility ? if yes, needs to be in advanced settings
  // we might want to check if extensions module is enabled before setting it to dropdown
  const metaKey = data.choices.length > 4 ? '__dropdown' : '__buttons'
  return {
    ...payload,
    metadata: {
      ...payload.metadata,
      // should we rename key in schema or we keep backward compatibility rendering ?
      [metaKey]: data.choices.map(c => ({ label: c.title, value: c.value }))
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
    displayedIn: ['sayNode', 'qna'],
    advancedSettings: [
      {
        key: 'typing',
        defaultValue: true,
        type: 'checkbox',
        label: 'module.builtin.typingIndicator'
      }
      // not supported yet, if we support we need to do so for buttons as well
      // {
      //   key: 'canAdd',
      //   type: 'checkbox',
      //   label: 'module.builtin.types.suggestions.allowToAdd'
      // },
      // not supported yet, if we support we need to do so for buttons as well
      // {
      //   key: 'multiple',
      //   type: 'checkbox',
      //   label: 'module.builtin.types.suggestions.allowMultiplePick'
      // }
    ],
    fields: [
      {
        key: 'suggestions',
        type: 'tag-input',
        translated: true,
        label: 'suggestions',
        placeholder: 'studio.library.addSynonyms',
        group: {
          addLabel: 'studio.library.addValueAlternative'
        }
      },
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
            superInput: true,
            translated: true,
            label: 'module.builtin.types.suggestions.label',
            placeholder: 'module.builtin.types.suggestions.labelPlaceholder'
          },
          {
            type: 'text',
            key: 'value',
            superInput: true,
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
