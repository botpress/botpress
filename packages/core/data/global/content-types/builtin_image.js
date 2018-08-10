const base = require('./_base.js')

module.exports = {
  id: 'builtin_image',
  group: 'Built-in Messages',
  title: 'Image',

  jsonSchema: {
    description: 'A message showing an image with an optional title',
    type: 'object',
    required: ['image'],
    properties: {
      image: {
        type: 'string',
        $subtype: 'media',
        $filter: '.jpg, .png, .jpeg, .gif, .bmp, .tif, .tiff|image/*',
        title: 'Image'
      },
      title: {
        type: 'string',
        description: 'Some platforms require to name the images.',
        title: 'Title (optional)'
      },
      ...base.typingIndicators
    }
  },

  uiSchema: {},

  computePreviewText: formData => {
    let fileName = path.basename(formData.image)

    if (fileName.includes('-')) {
      fileName = tail(fileName.split('-')).join('-')
    }

    const title = formData.title ? ' | ' + formData.title : ''
    return `Image (${fileName})${title}`
  },
  computeData: (typeId, formData) => formData,
  renderElement: data => [
    {
      on: 'facebook',
      image: url.resolve(data.BOT_URL, data.image),
      typing: data.typing
    },
    {
      on: 'webchat',
      type: 'file',
      url: url.resolve(data.BOT_URL, data.image),
      typing: data.typing
    },
    {
      on: 'microsoft',
      attachments: [
        {
          contentType: mime.getType(data.image),
          contentUrl: data.image,
          name: data.title
        }
      ]
    },
    {
      on: 'slack',
      attachments: [
        {
          title: data.title,
          image_url: data.image
        }
      ]
    }
  ]
}
