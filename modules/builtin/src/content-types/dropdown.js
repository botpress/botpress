const base = require('./_base')
const utils = require('./_utils')

function renderElement(data, channel) {
  return utils.extractPayload('dropdown', data)
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
