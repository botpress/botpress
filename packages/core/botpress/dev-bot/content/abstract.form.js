const _ = require('lodash')

module.exports = {
  id: 'abstract',
  title: 'Some Content',
  renderer: '#some-content',

  jsonSchema: {
    title: 'Bag of Strings',
    description: 'Some random strings',
    type: 'string'
  },

  computePreviewText: formData => formData
}
