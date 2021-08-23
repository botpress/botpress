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
      type: 'custom',
      module: 'extensions',
      component: 'Dropdown',
      message: data.message,
      buttonText: data.buttonText,
      displayInKeyboard: data.displayInKeyboard,
      options: data.options,
      allowCreation: data.allowCreation,
      allowMultiple: data.allowMultiple,
      width: data.width,
      collectFeedback: data.collectFeedback,
      placeholderText: data.placeholderText,
      markdown: data.markdown
    }
  ]
}

function renderSlack(data) {
  return [
    {
      type: 'actions',
      elements: [
        {
          type: 'static_select',
          action_id: 'option_selected',
          placeholder: {
            type: 'plain_text',
            text: data.message
          },
          options: data.options.map(q => ({
            text: {
              type: 'plain_text',
              text: q.label
            },
            value: q.value
          }))
        }
      ]
    }
  ]
}

function renderElement(data, channel) {
  // These channels now use channel renderers
  if (['telegram', 'twilio', 'slack', 'smooch', 'vonage', 'teams', 'messenger'].includes(channel)) {
    return utils.extractPayload('dropdown', data)
  }

  if (channel === 'web' || channel === 'api') {
    return render(data)
  } else if (channel === 'slack') {
    return renderSlack(data)
  } else if (channel === 'smooch') {
    return [data]
  }

  return []
}

const contentType: ContentType = {
  id: 'dropdown',
  group: 'Extensions',
  title: 'common.contentTypes.dropdown.title',

  jsonSchema: {
    title: 'common.contentTypes.dropdown.desc',
    type: 'object',
    required: ['message'],
    properties: {
      message: {
        type: 'string',
        title: 'Message'
      },
      buttonText: {
        type: 'string',
        title: 'common.contentTypes.dropdown.buttonText',
        description: 'common.contentTypes.dropdown.buttonDesc',
        default: ''
      },
      placeholderText: {
        type: 'string',
        title: 'common.contentTypes.dropdown.placeholderText',
        default: 'Select a choice'
      },
      options: {
        type: 'array',
        title: 'common.contentTypes.dropdown.optionsList',
        items: {
          type: 'object',
          required: ['label'],
          properties: {
            label: {
              description: 'common.contentTypes.dropdown.itemLabel',
              type: 'string',
              title: 'Label'
            },
            value: {
              description: 'common.contentTypes.dropdown.itemValue',
              type: 'string',
              title: 'Value'
            }
          }
        }
      },
      width: {
        type: 'number',
        title: 'common.contentTypes.dropdown.widthTitle',
        description: 'common.contentTypes.dropdown.widthDesc'
      },
      displayInKeyboard: {
        type: 'boolean',
        title: 'common.contentTypes.dropdown.asKeyboardTitle',
        description: 'common.contentTypes.dropdown.asKeyboardDesc',
        default: true
      },
      allowCreation: {
        type: 'boolean',
        title: 'common.contentTypes.dropdown.allowCreate'
      },
      allowMultiple: {
        type: 'boolean',
        title: 'common.contentTypes.dropdown.allowMultiple'
      },
      ...base.useMarkdown,
      ...base.typingIndicators
    }
  },
  uiSchema: {
    message: {
      'ui:field': 'i18n_field',
      $subtype: 'textarea'
    },
    buttonText: {
      'ui:field': 'i18n_field'
    },
    options: {
      'ui:field': 'i18n_array'
    }
  },
  computePreviewText: formData => formData.message && 'Dropdown: ' + formData.message,
  renderElement
}

export default contentType
