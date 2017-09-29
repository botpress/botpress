const fs = require('fs')
const path = require('path')
const EXTENSIONS_LITE_PATH = path.normalize('/extensions/lite/')

function requireEdition(file, edition) {
  const enterprisePath = edition === 'lite' ? '' : 'enterprise/'
  const extensionPath = path.resolve(__dirname, '../extensions', enterprisePath, edition, file)
  const exists = fs.existsSync(extensionPath)

  if (!exists && edition === 'lite') {
    throw new Error(`Lite Edition does not implement "${file}". Please report this as a bug to the Botpress team.`)
  } else if (!exists) {
    return null
  } else {
    return '/extensions/' + enterprisePath + edition
  }
}

function requireExtension(file, edition) {
  const editions = ['ultimate', 'pro', 'lite']
  edition = edition ? edition : process.env.BOTPRESS_EDITION || 'lite'

  const length = EXTENSIONS_LITE_PATH.length
  const start = file.indexOf(EXTENSIONS_LITE_PATH)

  file = file.substr(start + length)
  const upTo = file.indexOf('?') > 0 ? file.indexOf('?') : file.length
  file = file.substr(0, upTo)

  let index = editions.indexOf(edition)
  let extension = null
  while(extension == null) {
    extension = requireEdition(file, editions[index++])
  }

  return extension
}

module.exports = { requireExtension }