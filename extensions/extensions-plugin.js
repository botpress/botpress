var webpack = require('webpack')
var _ = require('lodash')
var fs = require('fs')
var path = require('path')

var { requireExtension } = require('./extensions.js')

const afterResolve = new webpack.NormalModuleReplacementPlugin(/extensions/i, function(res) {

  let customEdition = null
  const [rest, edition] = (res.rawRequest && res.rawRequest.match(/\?edition=(.+)/i)) || []

  edition && _.each(['lite', 'pro', 'ultimate'], e => {
    if (edition.toLowerCase().startsWith(e)) {
      customEdition = e
    }
  })
  
  if (!res.userRequest 
    || res.userRequest.indexOf('extensions/empty.jsx') >= 0
    || (res.userRequest.indexOf('extensions/enterprise') >= 0)) {
    return
  }

  const replacement = requireExtension(res.userRequest, customEdition)
  res.request = res.request.replace('/extensions/lite', replacement)
  res.resource = res.resource.replace('/extensions/lite', replacement)
})

const beforeResolve = new webpack.NormalModuleReplacementPlugin(/\+\/views/i, function(res) {
  const req = res.request.replace('+', path.join(__dirname, '/lite'))

  if (req.indexOf('?edition=') >= 0) {
    return
  }

  try {
    const replacement = requireExtension(req)
    res.request = req.replace('/extensions/lite', replacement)
  } catch (err) {
    res.request = path.join(__dirname, 'empty.jsx')
  }
})

module.exports = { beforeResolve, afterResolve }
