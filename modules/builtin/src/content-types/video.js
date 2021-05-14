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
      type: 'video',
      title: data.title,
      url: utils.formatURL(data.BOT_URL, data.video),
      collectFeedback: data.collectFeedback
    }
  ]
}

function renderElement(data, channel) {
  // These channels now use channel renderers
  if (['telegram', 'twilio', 'slack', 'vonage'].includes(channel)) {
    return utils.extractPayload('video', data)
  }

  return render(data)
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
    let fileName = ''

    if (utils.isUrl(link)) {
      fileName = path.basename(formData.video)
      if (fileName.includes('-')) {
        fileName = fileName
          .split('-')
          .slice(1)
          .join('-')
      }
      return `Video: (${fileName}) ${title}`
    } else {
      return `Expression: ${link}${title}`
    }
  },

  renderElement: renderElement
}
