var webpack = require('webpack')
var _ = require('lodash')

var { requireExtension } = require('./extensions.js')

module.exports = () => new webpack.NormalModuleReplacementPlugin(/extensions/i, function(res) {
  let customEdition = null
  const [rest, edition] = res.rawRequest.match(/\?edition=(.+)/i) || []

  edition && _.each(['lite', 'pro', 'ultimate'], e => {
    if (edition.toLowerCase().startsWith(e)) {
      customEdition = e
    }
  })

  const replacement = requireExtension(res.userRequest, customEdition)
  res.request = res.request.replace('/extensions/lite', replacement)
  res.resource = res.resource.replace('/extensions/lite', replacement)
})
