const base = require('./_base')
const path = require('path')
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
      type: 'file',
      title: data.title,
      url: utils.formatURL(data.BOT_URL, data.file),
      collectFeedback: data.collectFeedback
    }
  ]
}

function renderElement(data, channel) {
  // These channels now use channel renderers
  if (['telegram', 'twilio', 'slack', 'vonage'].includes(channel)) {
    return utils.extractPayload('file', data)
  }

  return render(data)
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
