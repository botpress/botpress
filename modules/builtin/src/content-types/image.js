const base = require('./_base')
const path = require('path')
const utils = require('./_utils')

function renderElement(data, channel) {
  return utils.extractPayload('image', data)
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
        $subtype: 'image',
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

    const link = utils.formatURL(formData.BOT_URL, formData.image)
    const title = formData.title ? ' | ' + formData.title : ''
    let fileName = ''

    if (utils.isUrl(link)) {
      fileName = path.basename(formData.image)
      if (fileName.includes('-')) {
        fileName = fileName
          .split('-')
          .slice(1)
          .join('-')
      }
      return `Image: [![${formData.title || ''}](<${link}>)](<${link}>) - (${fileName}) ${title}`
    } else {
      return `Expression: ${link}${title}`
    }
  },

  renderElement: renderElement
}
