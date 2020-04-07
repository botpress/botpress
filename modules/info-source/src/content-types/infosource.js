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
      type: 'custom',
      module: 'info-source',
      component: 'InfoSource',
      question: data.question,
      text: data.text,
      icon: data.icon,
      linkText: data.linkText,
      url: data.url,
      time: data.time,
      markdown: data.markdown
    }
  ]
}

function renderElement(data, channel) {
  if (channel === 'web') {
    return render(data)
  }

  return []
}

module.exports = {
  id: 'custom_infosource',
  group: 'MSSS',
  title: 'Info Source MSSS',
  jsonSchema: {
    description: 'Adds a footer to the text',
    type: 'object',
    required: ['text', 'icon', 'url', 'time', 'linkText'],
    properties: {
      question: {
        type: 'string',
        title: 'Question'
      },
      text: {
        type: 'string',
        title: 'Message'
      },
      icon: {
        type: 'string',
        title: 'Icon Url'
      },
      linkText: {
        type: 'string',
        title: 'Link Text'
      },
      url: {
        type: 'string',
        title: 'Link Url'
      },
      time: {
        type: 'string',
        title: 'Update Time'
      },
      markdown: {
        type: 'boolean',
        title: 'Use markdown',
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
    icon: {
      'ui:field': 'i18n_field'
    },
    linkText: {
      'ui:field': 'i18n_field'
    },
    url: {
      'ui:field': 'i18n_field'
    },
    time: {
      'ui:field': 'i18n_field'
    }
  },
  computePreviewText: formData => 'InfoSource: ' + formData.text,
  renderElement: renderElement
}
