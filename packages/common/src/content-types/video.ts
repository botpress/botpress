import { ContentType } from '.'
import base from './_base'
import utils from './_utils'

function render(data) {
  const events: any = []

  if (data.typing) {
    events.push({ type: 'typing', value: data.typing })
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

const contentType: ContentType = {
  id: 'builtin_video',
  group: 'Built-in Messages',
  title: 'common.contentTypes.video.title',

  jsonSchema: {
    description: 'common.contentTypes.video.description',
    type: 'object',
    $subtype: 'video',
    required: ['video'],
    properties: {
      video: {
        type: 'string',
        $subtype: 'video',
        $filter: '.mp4',
        title: 'common.contentTypes.video.title'
      },
      title: {
        type: 'string',
        title: 'common.contentTypes.video.videoLabel'
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
      return ''
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

  renderElement
}

export default contentType
