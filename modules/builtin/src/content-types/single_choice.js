const base = require('./_base')

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
      text: data.text,
      quick_replies: data.choices.map(c => ({
        title: c.title,
        payload: c.value.toUpperCase()
      })),
      typing: data.typing,
      markdown: data.markdown
    }
  ]
}

function renderMessenger(data) {
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
      text: data.text,
      quick_replies: data.choices.map(c => ({
        content_type: 'text',
        title: c.title,
        payload: c.value.toUpperCase()
      }))
    }
  ]
}

function renderSlack(data) {
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
      text: data.text,
      quick_replies: {
        type: 'actions',
        elements: data.choices.map((q, idx) => ({
          type: 'button',
          action_id: 'replace_buttons' + idx,
          text: {
            type: 'plain_text',
            text: q.title
          },
          value: q.value.toUpperCase()
        }))
      }
    }
  ]
}

function renderElement(data, channel) {
  if (channel === 'messenger') {
    return renderMessenger(data)
  } else if (channel === 'slack') {
    return renderSlack(data)
  } else {
    return render(data)
  }
}

module.exports = {
  id: 'builtin_single-choice',
  group: 'Built-in Messages',
  title: {
    en: 'Single Choice',
    fr: 'Choix Unique'
  },

  jsonSchema: {
    description: {
      en: 'Suggest choices to the user with the intention of picking only one (with an optional message)',
      fr: `Suggérer un choix à l'utilisateur avec l'intention de n'en sélectionner qu'un (avec un message optionnel)`
    },
    type: 'object',
    required: ['choices'],
    properties: {
      text: {
        type: 'string',
        title: 'Message'
      },
      choices: {
        type: 'array',
        title: {
          en: 'Choices',
          fr: 'Choix'
        },
        minItems: 1,
        maxItems: 10,
        items: {
          type: 'object',
          required: ['title', 'value'],
          properties: {
            title: {
              description: {
                en: 'The title of the choice (this is what gets shown to the user)',
                fr: `Le titre du choix (ce que verra l'utilisateur)`
              },
              type: 'string',
              title: 'Message'
            },
            value: {
              description: {
                en: 'The value that your bot gets when the user picks this choice (usually hidden from the user)',
                fr: `La valeur que recevra le bot lorsque l'utilisateur choisi cet item (habituellement caché de l'utilisateur)`
              },
              type: 'string',
              title: 'Value'
            }
          }
        }
      },
      markdown: {
        type: 'boolean',
        title: {
          en: 'Use markdown',
          fr: 'Utiliser markdown'
        },
        default: true
      },
      ...base.typingIndicators
    }
  },

  uiSchema: {
    text: {
      'ui:field': 'i18n_field'
    },
    choices: {
      'ui:field': 'i18n_array'
    }
  },
  computePreviewText: formData =>
    formData.choices && formData.text && `Choices (${formData.choices.length}) ${formData.text}`,
  renderElement: renderElement,
  hidden: true
}
