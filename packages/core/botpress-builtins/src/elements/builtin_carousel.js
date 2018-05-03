import * as base from './builtin_base_properties'
import Card from './builtin_card'

export default {
  id: 'builtin_carousel',
  renderer: '#builtin_carousel',

  group: 'Built-in Messages',
  title: 'Carousel',

  jsonSchema: {
    description: 'A carousel is an array of cards',
    type: 'array',
    items: Card.jsonSchema,
    ...base.typingIndicators
  },

  computePreviewText: formData => `Carousel: ${formData.length}`,

  computeMetadata: null
}
