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

const contentType: ContentType = {
  id: 'builtin_file',
  group: 'Built-in Messages',
  title: 'common.contentTypes.file.title',

  jsonSchema: {
    description: 'common.contentTypes.file.description',
    type: 'object',
    $subtype: 'file',
    required: ['file'],
    properties: {
      file: {
        type: 'string',
        $subtype: 'file',
        $filter: '.pdf',
        title: 'common.contentTypes.file.title'
      },
      title: {
        type: 'string',
        title: 'common.contentTypes.file.fileLabel'
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
      return ''
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

  renderElement
}

export default contentType
