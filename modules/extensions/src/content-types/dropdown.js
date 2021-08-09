const base = require('./_base')
const utils = require('./_utils')

function renderElement(data, channel) {
  return utils.extractPayload('dropdown', data)
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
      placeholderText: {
        type: 'string',
        title: 'module.extensions.types.dropdown.placeholderText',
        default: 'Select a choice'
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
        description: 'module.extensions.types.dropdown.widthDesc'
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
