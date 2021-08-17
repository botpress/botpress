const base = require('./_base')
const utils = require('./_utils')

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
      type: 'dropdown',
      message: data.message,
      buttonText: data.buttonText,
      displayInKeyboard: data.displayInKeyboard,
      options: data.options,
      allowCreation: data.allowCreation,
      allowMultiple: data.allowMultiple,
      width: data.width,
      collectFeedback: data.collectFeedback,
      placeholderText: data.placeholderText,
      markdown: data.markdown
    }
  ]
}

function renderSlack(data) {
  return [
    {
      type: 'actions',
      elements: [
        {
          type: 'static_select',
          action_id: 'option_selected',
          placeholder: {
            type: 'plain_text',
            text: data.message
          },
          options: data.options.map(q => ({
            text: {
              type: 'plain_text',
              text: q.label
            },
            value: q.value
          }))
        }
      ]
    }
  ]
}

function renderElement(data, channel) {
  // These channels now use channel renderers
  if (['telegram', 'twilio', 'slack', 'smooch', 'vonage', 'teams', 'messenger'].includes(channel)) {
    return utils.extractPayload('dropdown', data)
  }

  if (channel === 'web' || channel === 'api') {
    return render(data)
  } else if (channel === 'slack') {
    return renderSlack(data)
  } else if (channel === 'smooch') {
    return [data]
  }

  return []
}

module.exports = {
  id: 'dropdown',
  group: 'Extensions',
  title: 'module.builtin.types.dropdown.title',

  jsonSchema: {
    title: 'module.builtin.types.dropdown.desc',
    type: 'object',
    required: ['message'],
    properties: {
      message: {
        type: 'string',
        title: 'Message'
      },
      buttonText: {
        type: 'string',
        title: 'module.builtin.types.dropdown.buttonText',
        description: 'module.builtin.types.dropdown.buttonDesc',
        default: ''
      },
      placeholderText: {
        type: 'string',
        title: 'module.builtin.types.dropdown.placeholderText',
        default: 'Select a choice'
      },
      options: {
        type: 'array',
        title: 'module.builtin.types.dropdown.optionsList',
        items: {
          type: 'object',
          required: ['label'],
          properties: {
            label: {
              description: 'module.builtin.types.dropdown.itemLabel',
              type: 'string',
              title: 'Label'
            },
            value: {
              description: 'module.builtin.types.dropdown.itemValue',
              type: 'string',
              title: 'Value'
            }
          }
        }
      },
      width: {
        type: 'number',
        title: 'module.builtin.types.dropdown.widthTitle',
        description: 'module.builtin.types.dropdown.widthDesc'
      },
      displayInKeyboard: {
        type: 'boolean',
        title: 'module.builtin.types.dropdown.asKeyboardTitle',
        description: 'module.builtin.types.dropdown.asKeyboardDesc',
        default: true
      },
      allowCreation: {
        type: 'boolean',
        title: 'module.builtin.types.dropdown.allowCreate'
      },
      allowMultiple: {
        type: 'boolean',
        title: 'module.builtin.types.dropdown.allowMultiple'
      },
      ...base.useMarkdown,
      ...base.typingIndicators
    }
  },
  uiSchema: {
    message: {
      'ui:field': 'i18n_field',
      $subtype: 'textarea'
    },
    buttonText: {
      'ui:field': 'i18n_field'
    },
    options: {
      'ui:field': 'i18n_array'
    }
  },
  computePreviewText: formData => formData.message && 'Dropdown: ' + formData.message,
  renderElement
}
