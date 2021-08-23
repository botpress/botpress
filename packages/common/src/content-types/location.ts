import { ContentType } from '.'
import base from './_base'
import utils from './_utils'

const contentType: ContentType = {
  id: 'builtin_location',
  group: 'Built-in Messages',
  title: 'common.contentTypes.location.title',

  jsonSchema: {
    description: 'common.contentTypes.location.description',
    type: 'object',
    $subtype: 'location',
    required: ['latitude', 'longitude'],
    properties: {
      latitude: {
        type: 'number',
        title: 'common.contentTypes.location.latitude'
      },
      longitude: {
        type: 'number',
        title: 'common.contentTypes.location.longitude'
      },
      address: {
        type: 'string',
        title: 'common.contentTypes.location.address'
      },
      title: {
        type: 'string',
        title: 'common.contentTypes.location.label'
      },
      ...base.typingIndicators
    }
  },

  uiSchema: {},

  computePreviewText: formData => `${formData.latitude}° ${formData.longitude}°`,
  renderElement: (data, channel) => utils.extractPayload('location', data)
}

export default contentType
