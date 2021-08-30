const base = require('./_base')
const utils = require('./_utils')

function renderElement(data, channel) {
  return utils.extractPayload('audio', data)
}

module.exports = {
  id: 'builtin_audio',
  group: 'Built-in Messages',
  title: 'module.builtin.types.audio.title',

  jsonSchema: {
    description: 'module.builtin.types.audio.description',
    type: 'object',
    $subtype: 'audio',
    required: ['audio'],
    properties: {
      audio: {
        type: 'string',
        $subtype: 'audio',
        $filter: '.mp3',
        title: 'module.builtin.types.audio.title'
      },
      title: {
        type: 'string',
        title: 'module.builtin.types.audio.audioLabel'
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
    if (!formData.audio) {
      return
    }

    const link = utils.formatURL(formData.BOT_URL, formData.audio)
    const title = formData.title ? ' | ' + formData.title : ''

    if (utils.isUrl(link)) {
      const fileName = utils.extractFileName(formData.audio)
      return `Audio: (${fileName}) ${title}`
    } else {
      return `Expression: ${link}${title}`
    }
  },

  renderElement: renderElement
}
