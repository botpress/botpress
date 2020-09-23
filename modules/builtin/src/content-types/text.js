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
      type: 'text',
      markdown: data.markdown,
      text: data.text,
      collectFeedback: data.collectFeedback
    }
  ]
}

function renderElement(data, channel) {
  if (['web', 'slack', 'teams', 'messenger', 'telegram', 'twilio'].includes(channel)) {
    return base.renderer(data, 'text')
  } else {
    return render(data)
  }
}

module.exports = {
  id: 'builtin_text',
  group: 'Built-in Messages',
  title: 'text',

  jsonSchema: {
    description: 'module.builtin.types.text.description',
    type: 'object',
    required: ['text'],
    properties: {
      text: {
        type: 'string',
        title: 'module.builtin.types.text.message'
      },
      variations: {
        type: 'array',
        title: 'module.builtin.types.text.alternative_plural',
        items: {
          type: 'string',
          default: ''
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
      'ui:field': 'i18n_field',
      $subtype: 'textarea'
    },
    variations: {
      'ui:options': {
        orderable: false
      }
    }
  },
  newSchema: {
    displayedIn: ['sayNode'],
    order: 0,
    advancedSettings: [
      {
        key: 'markdown',
        label: 'module.builtin.useMarkdown',
        type: 'checkbox',
        defaultValue: true,
        moreInfo: {
          label: 'learnMore',
          url: 'https://daringfireball.net/projects/markdown/'
        }
      }
    ],
    fields: [
      {
        type: 'overridable',
        overrideKey: 'textOverride',
        key: 'text',
        translated: true,
        label: 'text'
      },
      {
        type: 'hidden',
        translated: true,
        key: 'variations'
      }
    ]
  },
  computePreviewText: formData => formData.text,

  renderElement: renderElement
}
