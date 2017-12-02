const fs = require('fs')
const path = require('path')

const KNOWN_EDITIONS = ['ultimate', 'pro', 'lite']
const DEFAULT_EDITION = 'lite'

const requireEdition = (file, edition) => {
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

const requireExtension = (file, edition) => {
  edition = edition || process.env.BOTPRESS_EDITION || DEFAULT_EDITION

  const length = '/extensions/lite/'.length
  const start = file.indexOf('/extensions/lite/')

  file = file.substr(start + length)
  const upTo = file.indexOf('?') > 0 ? file.indexOf('?') : file.length
  file = file.substr(0, upTo)

  let index = KNOWN_EDITIONS.indexOf(edition)
  let extension = null
  while (extension == null) {
    extension = requireEdition(file, KNOWN_EDITIONS[index++])
  }

  return extension
}

module.exports = { requireExtension }
