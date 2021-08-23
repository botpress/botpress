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
      type: 'text',
      markdown: data.markdown,
      text: data.text,
      collectFeedback: data.collectFeedback
    }
  ]
}

function renderElement(data, channel) {
  // These channels now use channel renderers
  if (['telegram', 'twilio', 'slack', 'smooch', 'vonage', 'teams', 'messenger'].includes(channel)) {
    return utils.extractPayload('text', data)
  }

  return render(data)
}

const contentType: ContentType = {
  id: 'builtin_text',
  group: 'Built-in Messages',
  title: 'text',

  jsonSchema: {
    description: 'common.contentTypes.text.description',
    type: 'object',
    required: ['text'],
    properties: {
      text: {
        type: 'string',
        title: 'common.contentTypes.text.message'
      },
      variations: {
        type: 'array',
        title: 'common.contentTypes.text.alternatives',
        items: {
          type: 'string',
          default: ''
        }
      },
      ...base.useMarkdown,
      ...base.typingIndicators
    }
  },

  uiSchema: {
    text: {
      'ui:field': 'i18n_field',
      $subtype: 'textarea'
    },
    variations: {
      'ui:options': {
        orderable: false
      }
    }
  },
  computePreviewText: formData => formData.text,

  renderElement
}

export default contentType
