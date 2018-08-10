const _ = require('lodash')

export default data => [
  {
    // on: '*',
    text: _.sample([data.text, ...(data.variations || [])]),
    typing: data.typing,
    markdown: true // Webchat only
  }
]
