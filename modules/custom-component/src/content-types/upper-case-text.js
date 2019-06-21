function render(data) {
  return [
    {
      type: 'custom',
      module: 'custom-component',
      component: 'UpperCasedText',
      text: data.text
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
  id: 'custom_uppercase',
  group: 'Custom Component',
  title: 'Upper Cased Text',
  jsonSchema: {
    description: 'The text will be send all in upper-case letters',
    type: 'object',
    required: ['text'],
    properties: {
      text: {
        type: 'string',
        title: 'Message'
      }
    }
  },
  uiSchema: {},
  computePreviewText: formData => 'Upper Case: ' + formData.text,
  renderElement: renderElement
}
