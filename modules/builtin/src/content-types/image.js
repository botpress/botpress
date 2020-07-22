const base = require('./_base')
const path = require('path')
const url = require('url')
const { tail } = _

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
      type: 'file',
      title: data.title,
      url: `${data.BOT_URL}${data.image}`,
      collectFeedback: data.collectFeedback
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
      attachment: {
        type: 'image',
        payload: {
          is_reusable: true,
          url: `${data.BOT_URL}${data.image}`
        }
      }
    }
  ]
}

function renderTelegram(data) {
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
      type: 'image',
      url: `${data.BOT_URL}${data.image}`
    }
  ]
}

function renderTeams(data) {
  const events = []

  if (data.typing) {
    events.push({
      type: 'typing'
    })
  }

  return [
    ...events,
    {
      type: 'message',
      attachments: [
        {
          name: data.title,
          contentType: 'image/png',
          contentUrl: `${data.BOT_URL}${data.image}`
        }
      ]
    }
  ]
}

function renderElement(data, channel) {
  if (channel === 'web' || channel === 'slack') {
    return base.renderer(data, 'image')
  } else if (channel === 'messenger') {
    return renderMessenger(data)
  } else if (channel === 'telegram') {
    return renderTelegram(data)
  } else if (channel === 'teams') {
    return renderTeams(data)
  } else {
    return render(data)
  }
}

module.exports = {
  id: 'builtin_image',
  group: 'Built-in Messages',
  title: 'image',

  jsonSchema: {
    description: 'module.builtin.types.image.description',
    type: 'object',
    required: ['image'],
    properties: {
      image: {
        type: 'string',
        $subtype: 'media',
        $filter: '.jpg, .png, .jpeg, .gif, .bmp, .tif, .tiff|image/*',
        title: 'module.builtin.types.image.title'
      },
      title: {
        type: 'string',
        title: 'module.builtin.types.image.imageLabel',
        description: 'module.builtin.types.image.labelDesc'
      },
      ...base.typingIndicators
    }
  },

  uiSchema: {
    title: {
      'ui:field': 'i18n_field'
    }
  },

  newSchema: {
    displayedIn: ['qna', 'sayNode'],
    advancedSettings: [
      {
        key: 'markdown',
        label: 'module.builtin.useMarkdown',
        defaultValue: true,
        type: 'checkbox',
        moreInfo: {
          label: 'learnMore',
          url: 'https://daringfireball.net/projects/markdown/'
        }
      },
      {
        key: 'typing',
        defaultValue: true,
        type: 'checkbox',
        label: 'module.builtin.typingIndicator'
      }
    ],
    fields: [
      {
        type: 'upload',
        key: 'image',
        label: 'module.builtin.types.image.uploadImage'
      },
      {
        type: 'text',
        key: 'title',
        translated: true,
        label: 'title',
        placeholder: 'module.builtin.optional'
      }
    ]
  },

  computePreviewText: formData => {
    if (!formData.image) {
      return
    }

    let fileName = path.basename(formData.image)
    if (fileName.includes('-')) {
      fileName = tail(fileName.split('-')).join('-')
    }
    const link = `${formData.BOT_URL}${formData.image}`
    const title = formData.title ? ' | ' + formData.title : ''
    return `Image: [![${formData.title || ''}](<${link}>)](<${link}>) - (${fileName}) ${title}`
  },

  renderElement: renderElement
}
