const webpack = require('webpack')
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const EXTENSIONS_LITE_PATH = path.normalize('/extensions/lite')


var { requireExtension } = require('./extensions.js')

const afterResolve = new webpack.NormalModuleReplacementPlugin(/extensions/i, function(res) {

  let customEdition = null
  const userRequest = res.userRequest ? path.normalize(res.userRequest) : res.userRequest
  const [rest, edition] = (res.rawRequest && res.rawRequest.match(/\?edition=(.+)/i)) || []

  edition && _.each(['lite', 'pro', 'ultimate'], e => {
    if (edition.toLowerCase().startsWith(e)) {
      customEdition = e
    }
  })

  if (!userRequest
    || userRequest.indexOf(path.normalize('extensions/empty.jsx')) >= 0
    || (userRequest.indexOf(path.normalize('extensions/enterprise')) >= 0)) {
    return
  }

  const replacement = requireExtension(userRequest, customEdition)
  res.request = res.request.replace(EXTENSIONS_LITE_PATH, replacement)
  res.resource = res.resource.replace(EXTENSIONS_LITE_PATH, replacement)
})

const beforeResolve = new webpack.NormalModuleReplacementPlugin(/\+\/views/i, function(res) {
  const reqPath = path.normalize(res.request)
  const req = reqPath.replace('+', path.join(__dirname, '/lite'))

  if (req.indexOf('?edition=') >= 0) {
    return
  }

  try {
    const replacement = requireExtension(req)
    res.request = path.normalize(req.replace(EXTENSIONS_LITE_PATH, replacement))
  } catch (err) {
    res.request = path.join(__dirname, 'empty.jsx')
  }
})

module.exports = { beforeResolve, afterResolve }
