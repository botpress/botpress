import fs from 'fs'
import {resolveProjectFile} from './util'

module.exports = (projectLocation) => {

  const getBotInformation = () => {
    const packageJsonPath = resolveProjectFile('package.json', projectLocation, true)
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath))

    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description || 'No description',
      author: packageJson.author || '<no author>',
      license: packageJson.license || 'AGPL-v3.0'
    }
  }

  return { getBotInformation }
}
