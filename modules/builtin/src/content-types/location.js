const base = require('./_base')
const utils = require('./_utils')

function renderElement(data, channel) {
  return utils.extractPayload('location', data)
}

module.exports = {
  id: 'builtin_location',
  group: 'Built-in Messages',
  title: 'module.builtin.types.location.title',

  jsonSchema: {
    description: 'module.builtin.types.location.description',
    type: 'object',
    $subtype: 'location',
    required: ['latitude', 'longitude'],
    properties: {
      latitude: {
        type: 'number',
        title: 'module.builtin.types.location.latitude'
      },
      longitude: {
        type: 'number',
        title: 'module.builtin.types.location.longitude'
      },
      address: {
        type: 'string',
        title: 'module.builtin.types.location.address'
      },
      title: {
        type: 'string',
        title: 'module.builtin.types.location.label'
      },
      ...base.typingIndicators
    }
  },

  uiSchema: {},

  computePreviewText: formData => `${formData.latitude}° ${formData.longitude}°`,

  renderElement: renderElement
}
