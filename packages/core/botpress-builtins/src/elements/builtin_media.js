import path from 'path'
import tail from 'lodash/tail'

import * as base from './builtin_base_properties'

export default {
  id: 'builtin_media',
  renderer: '#builtin_media',

  group: 'Built-in Messages',
  title: 'Media',

  jsonSchema: {
    description: 'A message based on a media file',
    type: 'object',
    required: ['type', 'source'],
    properties: {
      type: {
        type: 'string',
        description: 'Type of the media file',
        title: 'Type',
        enum: ['image', 'audio', 'video', 'file']
      },
      source: {
        type: 'string',
        description: 'How the file will be specified.',
        title: 'Source',
        enum: ['File Upload', 'Remote URL'],
        default: 'File Upload'
      },
      title: {
        type: 'string',
        description: 'Some platforms require to name the images.',
        title: 'Title (optional)'
      },
      reusable: {
        type: 'boolean',
        title: 'Save and Re-Use Attachment?',
        description: 'Generate attachment_id to avoid re-uploading from URL',
        default: true
      },
      ...base.messagingPurpose,
      ...base.typingIndicators
    },
    dependencies: {
      source: {
        oneOf: [
          {
            properties: {
              source: {
                enum: ['File Upload']
              },
              file: {
                type: 'string',
                $subtype: 'media',
                //TODO: Conditional filter by file type (???)
                //$filter: '.jpg, .png, .jpeg, .gif, .bmp, .tif, .tiff|image/*',
                title: 'File'
              }
            },
            required: ['file']
          },
          {
            properties: {
              source: {
                enum: ['Remote URL']
              },
              url: {
                type: 'string',
                title: 'Valid URL to retrieve the file'
              }
            },
            required: ['url']
          }
        ]
      }
    }
  },

  uiSchema: {},

  computePreviewText: formData => {
    let fileName = formData.file ? path.basename(formData.file) : formData.url.split('/').pop()

    if (fileName.includes('-')) {
      fileName = tail(fileName.split('-')).join('-')
    }

    const title = formData.title ? ' | ' + formData.title : ''
    return `File (${fileName})${title}`
  },

  computeMetadata: null
}
