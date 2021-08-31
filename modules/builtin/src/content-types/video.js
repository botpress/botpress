const base = require('./_base')
const utils = require('./_utils')

function renderElement(data, channel) {
  return utils.extractPayload('video', data)
}

module.exports = {
  id: 'builtin_video',
  group: 'Built-in Messages',
  title: 'module.builtin.types.video.title',

  jsonSchema: {
    description: 'module.builtin.types.video.description',
    type: 'object',
    $subtype: 'video',
    required: ['video'],
    properties: {
      video: {
        type: 'string',
        $subtype: 'video',
        $filter: '.mp4',
        title: 'module.builtin.types.video.title'
      },
      title: {
        type: 'string',
        title: 'module.builtin.types.video.videoLabel'
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
    if (!formData.video) {
      return
    }

    const link = utils.formatURL(formData.BOT_URL, formData.video)
    const title = formData.title ? ' | ' + formData.title : ''

    if (utils.isUrl(link)) {
      const fileName = utils.extractFileName(formData.video)
      return `Video: (${fileName}) ${title}`
    } else {
      return `Expression: ${link}${title}`
    }
  },

  renderElement: renderElement
}
