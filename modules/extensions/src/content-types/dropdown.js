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
      width: data.width
    }
  ]
}

function renderElement(data, channel) {
  if (channel === 'web' || channel === 'api') {
    return render(data)
  }

  return []
}

module.exports = {
  id: 'dropdown',
  group: 'Extensions',
  title: 'Dropdown',

  jsonSchema: {
    title: 'Displays a list of options to the user',
    type: 'object',
    required: ['message'],
    properties: {
      message: {
        type: 'string',
        title: 'Message'
      },
      buttonText: {
        type: 'string',
        title: 'The text to display on the button.',
        description: 'When left blank, the selected option is sent when the dropdown is closed',
        default: ''
      },
      options: {
        type: 'array',
        title: 'List of options',
        items: {
          type: 'object',
          required: ['label'],
          properties: {
            label: {
              description: 'The text displayed in the dropdown menu',
              type: 'string',
              title: 'Label'
            },
            value: {
              description: 'The value that the bot will receive (optional)',
              type: 'string',
              title: 'Value'
            }
          }
        }
      },
      width: {
        type: 'number',
        title: 'The width of the component (in pixels)',
        description: 'The default size displays the select and the button on one line. Change it to fit your needs',
        default: 200
      },
      displayInKeyboard: {
        type: 'boolean',
        title: 'Display as keyboard',
        description: 'It will be displayed right on top of the composer (like choices)',
        default: true
      },
      allowCreation: {
        type: 'boolean',
        title: 'Allow creation of new options'
      },
      allowMultiple: {
        type: 'boolean',
        title: 'Allow multiple choices'
      },
      ...base.typingIndicators
    }
  },
  uiSchema: {
    message: { 'ui:field': 'i18n_field' },
    buttonText: { 'ui:field': 'i18n_field' },
    options: { 'ui:field': 'i18n_array' }
  },
  computePreviewText: formData => formData.message && 'Dropdown: ' + formData.message,
  renderElement
}
