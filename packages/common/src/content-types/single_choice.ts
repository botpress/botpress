import { ContentType } from '.'
import base from './_base'
import utils from './_utils'

const render = data => {
  const events: any = []

  if (data.typing) {
    events.push({ type: 'typing', value: data.typing })
  }

  if (data.isDropdown) {
    return [
      ...events,
      {
        type: 'custom',
        module: 'extensions',
        component: 'Dropdown',
        message: data.text,
        buttonText: '',
        displayInKeyboard: true,
        options: data.choices.map(c => ({ label: c.title, value: c.value.toUpperCase() })),
        placeholderText: data.dropdownPlaceholder
      }
    ]
  }

  return [
    ...events,
    {
      text: data.text,
      quick_replies: data.choices.map(c => ({
        title: c.title,
        payload: c.value.toUpperCase()
      })),
      typing: data.typing,
      markdown: data.markdown,
      disableFreeText: data.disableFreeText
    }
  ]
}

function renderElement(data, channel) {
  // These channels now use channel renderers
  if (['telegram', 'twilio', 'slack', 'smooch', 'vonage', 'teams', 'messenger'].includes(channel)) {
    return utils.extractPayload('single-choice', data)
  }

  return render(data)
}

const contentType: ContentType = {
  id: 'builtin_single-choice',
  group: 'Built-in Messages',
  title: 'common.contentTypes.singleChoice.title',

  jsonSchema: {
    description: 'common.contentTypes.singleChoice.description',
    type: 'object',
    required: ['choices'],
    properties: {
      text: {
        type: 'string',
        title: 'message'
      },
      isDropdown: {
        type: 'boolean',
        title: 'Show as a dropdown'
      },
      dropdownPlaceholder: {
        type: 'string',
        title: 'Dropdown placeholder',
        default: 'Select...'
      },
      choices: {
        type: 'array',
        title: 'common.contentTypes.singleChoice.choice',
        minItems: 1,
        maxItems: 10,
        items: {
          type: 'object',
          required: ['title', 'value'],
          properties: {
            title: {
              description: 'common.contentTypes.singleChoice.itemTitle',
              type: 'string',
              title: 'Message'
            },
            value: {
              description: 'common.contentTypes.singleChoice.itemValue',
              type: 'string',
              title: 'Value'
            }
          }
        }
      },
      ...base.useMarkdown,
      disableFreeText: {
        type: 'boolean',
        title: 'common.contentTypes.disableFreeText',
        default: false
      },
      ...base.typingIndicators
    }
  },

  uiSchema: {
    text: {
      'ui:field': 'i18n_field',
      $subtype: 'textarea'
    },
    choices: {
      'ui:field': 'i18n_array'
    }
  },
  computePreviewText: formData =>
    formData.choices && formData.text && `Choices (${formData.choices.length}) ${formData.text}`,
  renderElement,
  hidden: true
}

export default contentType
