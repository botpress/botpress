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
      module: 'extensions',
      component: 'Dropdown',
      message: data.message,
      buttonText: data.buttonText,
      displayInKeyboard: data.displayInKeyboard,
      options: data.options,
      allowCreation: data.allowCreation,
      allowMultiple: data.allowMultiple,
      width: data.width,
      collectFeedback: data.collectFeedback
    }
  ]
}

function renderer(data) {
  const payload = base.renderer(data, 'text')
  return {
    ...payload,
    metadata: {
      ...payload.metadata,
      __dropdown: data.options
    }
  }
}

function renderElement(data, channel) {
  if (channel === 'web' || channel === 'slack') {
    return renderer(data)
  } else if (channel === 'api') {
    return render(data)
  } else if (channel === 'smooch') {
    return [data]
  }

  return []
}

module.exports = {
  id: 'dropdown',
  group: 'Extensions',
  title: 'module.extensions.types.dropdown.title',

  jsonSchema: {
    title: 'module.extensions.types.dropdown.desc',
    type: 'object',
    required: ['message'],
    properties: {
      message: {
        type: 'string',
        title: 'Message'
      },
      buttonText: {
        type: 'string',
        title: 'module.extensions.types.dropdown.buttonText',
        description: 'module.extensions.types.dropdown.buttonDesc',
        default: ''
      },
      options: {
        type: 'array',
        title: 'module.extensions.types.dropdown.optionsList',
        items: {
          type: 'object',
          required: ['label'],
          properties: {
            label: {
              description: 'module.extensions.types.dropdown.itemLabel',
              type: 'string',
              title: 'Label'
            },
            value: {
              description: 'module.extensions.types.dropdown.itemValue',
              type: 'string',
              title: 'Value'
            }
          }
        }
      },
      width: {
        type: 'number',
        title: 'module.extensions.types.dropdown.widthTitle',
        description: 'module.extensions.types.dropdown.widthDesc',
        default: 200
      },
      displayInKeyboard: {
        type: 'boolean',
        title: 'module.extensions.types.dropdown.asKeyboardTitle',
        description: 'module.extensions.types.dropdown.asKeyboardDesc',
        default: true
      },
      allowCreation: {
        type: 'boolean',
        title: 'module.extensions.types.dropdown.allowCreate'
      },
      allowMultiple: {
        type: 'boolean',
        title: 'module.extensions.types.dropdown.allowMultiple'
      },
      ...base.typingIndicators
    }
  },
  uiSchema: {
    message: {
      'ui:field': 'i18n_field'
    },
    buttonText: {
      'ui:field': 'i18n_field'
    },
    options: {
      'ui:field': 'i18n_array'
    }
  },
  newSchema: {
    displayedIn: [],
    advancedSettings: [],
    fields: []
  },
  computePreviewText: formData => formData.message && 'Dropdown: ' + formData.message,
  renderElement
}
