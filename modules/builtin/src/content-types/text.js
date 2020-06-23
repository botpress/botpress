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
      type: 'text',
      text: data.text
    }
  ]
}

function renderTeams(data) {
  const events = []

  if (data.typing) {
    events.push({
      type: 'typing'
    })
  }

  return [
    ...events,
    {
      type: 'message',
      text: data.text
    }
  ]
}

function renderElement(data, channel) {
  if (channel === 'messenger') {
    return renderMessenger(data)
  } else if (channel === 'teams') {
    return renderTeams(data)
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
    advancedSettings: [
      {
        key: 'markdown',
        label: 'module.builtin.useMarkdown',
        type: 'checkbox',
        moreInfo: {
          label: 'learnMore',
          url: 'https://daringfireball.net/projects/markdown/'
        }
      },
      {
        key: 'typing',
        type: 'checkbox',
        label: 'module.builtin.typingIndicator'
      }
    ],
    fields: [
      {
        type: 'text',
        key: 'text',
        label: 'module.builtin.types.text.message'
      },
      {
        group: {
          addLabel: 'module.builtin.types.text.add',
          contextMenu: [
            {
              type: 'delete',
              label: 'module.builtin.types.text.delete'
            }
          ]
        },
        type: 'group',
        key: 'variations',
        renderType: 'variations',
        label: 'module.builtin.types.text.alternative',
        fields: [
          {
            type: 'text',
            key: 'item',
            label: 'module.builtin.types.text.alternativeLabel'
          }
        ]
      }
    ]
  },
  computePreviewText: formData => formData.text,

  renderElement: renderElement
}
