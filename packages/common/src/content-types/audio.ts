import { ContentType } from '.'
import base from './_base'
import utils from './_utils'

function render(data) {
  const events: any = []

  if (data.typing) {
    events.push({
      type: 'typing',
      value: data.typing
    })
  }

  return [
    ...events,
    {
      type: 'audio',
      title: data.title,
      url: utils.formatURL(data.BOT_URL, data.audio),
      collectFeedback: data.collectFeedback
    }
  ]
}

function renderElement(data, channel) {
  // These channels now use channel renderers
  if (['telegram', 'twilio', 'slack', 'vonage'].includes(channel)) {
    return utils.extractPayload('audio', data)
  }

  return render(data)
}

const contentType: ContentType = {
  id: 'builtin_audio',
  group: 'Built-in Messages',
  title: 'common.contentTypes.audio.title',

  jsonSchema: {
    description: 'common.contentTypes.audio.description',
    type: 'object',
    $subtype: 'audio',
    required: ['audio'],
    properties: {
      audio: {
        type: 'string',
        $subtype: 'audio',
        $filter: '.mp3',
        title: 'common.contentTypes.audio.title'
      },
      title: {
        type: 'string',
        title: 'common.contentTypes.audio.audioLabel'
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
      return ''
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

  renderElement
}

export default contentType
