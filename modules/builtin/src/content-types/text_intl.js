const base = require('./_base')

function renderElement(data) {
  const language = data.user.language.toLowerCase() || 'ro'
  return [
    {
      type: 'text',
      typing: true,
      markdown: true,
      text: data[`text_${language}`],
      'web-style': { direction: language === 'Ar' ? 'rtl' : 'ltr' }
    }
  ]
}

module.exports = {
  id: 'builtin_text_intl',
  group: 'Built-in Messages',
  title: 'text_intl',

  jsonSchema: {
    title: 'Text Message',
    description: 'A normal text message with translations',
    type: 'object',
    required: ['text_en', 'text_ro', 'text_ru'],
    properties: {
      text_en: { type: 'string', title: 'Text (English)' },
      text_ro: { type: 'string', title: 'Text (Romanian)' },
      text_ru: { type: 'string', title: 'Text (Russian )' },
      variations: {
        type: 'array',
        title: 'module.builtin.types.text.alternatives',
        items: {
          type: 'string',
          default: ''
        }
      },
      markdown: {
        type: 'boolean',
        title: 'module.builtin.useMarkdown',
        default: true
      },
      ...base.typingIndicators
    }
  },

  uiSchema: {
    text_en: {
      'ui:field': 'i18n_field',
      $subtype: 'textarea'
    },
    text_ro: {
      'ui:field': 'i18n_field',
      $subtype: 'textarea'
    },
    text_ru: {
      'ui:field': 'i18n_field',
      $subtype: 'textarea'
    },
    variations: {
      'ui:options': {
        orderable: false
      }
    }
  },
  computePreviewText: formData => formData.text_ro || '?',
  renderElement: renderElement
}
