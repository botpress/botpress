import fs from 'fs'
import { resolveProjectFile } from './util'

module.exports = projectLocation => {
  const getBotInformation = () => {
    const packageJsonPath = resolveProjectFile('package.json', projectLocation, true)
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath))

    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description || '<no description>',
      author: (typeof packageJson.author === 'object' ? packageJson.author.name : packageJson.author) || '<no author>',
      license: packageJson.license || 'AGPL-3.0-only'
    }
  }

  return { getBotInformation }
}
