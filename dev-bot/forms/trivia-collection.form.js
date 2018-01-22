const _ = require('lodash')

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

  computeFormData: formData => {
    console.log(formData)
    return formData.map(datum => datum.computeFormData())
  },
  computePreviewText: formData => {
    console.log(formData)
    return `Trivia Collection [${formData.map(datum => datum.computePreviewText()).join(', ')}]`
  },
  computeMetadata: null
}
