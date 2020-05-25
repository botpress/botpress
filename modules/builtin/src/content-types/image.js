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
      type: 'image',
      title: data.title && {
        type: 'plain_text',
        text: data.title
      },
      image_url: `${data.BOT_URL}${data.image}`,
      alt_text: 'image'
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
  if (channel === 'messenger') {
    return renderMessenger(data)
  } else if (channel === 'telegram') {
    return renderTelegram(data)
  } else if (channel === 'slack') {
    return renderSlack(data)
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
