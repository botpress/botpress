import fs from 'fs'
import path from 'path'

function requireEdition(file, edition) {
  const extensionPath = path.resolve(__dirname, '../extensions', edition, file)
  const exists = fs.existsSync(extensionPath)

  if (!exists && edition === 'lite') {
    throw new Error(`Lite Edition does not implement "${file}". Please report this as a bug to the Botpress team.`)
  } else if (!exists) {
    return null
  } else {
    return require(extensionPath)
  }
}

function requireExtension(file) {
  const edition = process.env.BOTPRESS_EDITION || 'lite'
  console.log('CURRENT EDITION = ', edition)
  const editions = ['ultimate', 'pro', 'lite']

  let index = editions.indexOf(edition)
  let extension = null
  while(extension == null) {
    let extension = requireEdition(file, editions[index++])
  }

  return extension
}

module.exports = { requireExtension }