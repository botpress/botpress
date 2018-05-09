import path from 'path'
import tail from 'lodash/tail'

import * as base from './builtin_base_properties'

export default {
  id: 'builtin_image',
  renderer: '#builtin_image',

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

  computeMetadata: null
}
