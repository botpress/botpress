function render(_data) {
  return [
    {
      type: 'comment',
      text: ''
    }
  ]
}

module.exports = {
  id: 'builtin_comment',
  group: 'Built-in Comment',
  title: 'Comment',

  jsonSchema: {
    description: 'module.builtin.types.comment.description',
    type: 'object',
    required: ['text'],
    properties: {
      text: {
        type: 'string',
        title: 'module.builtin.types.comment.text'
      }
    }
  },

  uiSchema: {
    text: {
      'ui:field': 'i18n_field',
      $subtype: 'textarea'
    }
  },
  computePreviewText: formData => formData.text,

  renderElement: render
}
