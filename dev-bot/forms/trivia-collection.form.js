const Promise = require('bluebird')

module.exports = {
  id: 'trivia-collection',
  title: 'Trivia Questions Collection',
  ummBloc: '#trivia-collection',

  jsonSchema: {
    title: 'Trivia Collection',
    description: 'Create a new Trivia Collection by combining existing questions',
    type: 'array',
    items: {
      type: 'string',
      $subtype: 'ref',
      $category: 'trivia'
    }
  },

  computeFormData: (formData, computeFormData) => Promise.map(formData, computeFormData.bind(null, 'trivia')),
  computePreviewText: async (formData, computePreviewText) => {
    const triviaPreviews = await Promise.map(formData, computePreviewText.bind(null, 'trivia'))
    return `Trivia Collection [${triviaPreviews.join(', ')}]`
  },
  computeMetadata: null
}
