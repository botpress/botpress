const base = require('./_base')
const utils = require('./_utils')

function renderElement(data, channel) {
  return utils.extractPayload('file', data)
}

module.exports = {
  id: 'builtin_file',
  group: 'Built-in Messages',
  title: 'module.builtin.types.file.title',

  jsonSchema: {
    description: 'module.builtin.types.file.description',
    type: 'object',
    $subtype: 'file',
    required: ['file'],
    properties: {
      file: {
        type: 'string',
        $subtype: 'file',
        $filter: '.pdf',
        title: 'module.builtin.types.file.title'
      },
      title: {
        type: 'string',
        title: 'module.builtin.types.file.fileLabel'
      },
      ...base.typingIndicators
    }
  },

  uiSchema: {
    title: {
      'ui:field': 'i18n_field'
    }
  },

  computePreviewText: formData => {
    if (!formData.file) {
      return
    }

    const link = utils.formatURL(formData.BOT_URL, formData.file)
    const title = formData.title ? ' | ' + formData.title : ''

    if (utils.isUrl(link)) {
      const fileName = utils.extractFileName(formData.file)
      return `File: (${fileName}) ${title}`
    } else {
      return `Expression: ${link}${title}`
    }
  },

  renderElement: renderElement
}
