import fs from 'fs'
import path from 'path'

const version = process.env.npm_package_version

if (!version) {
  throw new Error('npm_package_version is not defined')
}

const filePath = path.join(__dirname, 'src', 'version.ts')
const content = `export const SDK_VERSION = '${version}'\n`

fs.writeFileSync(filePath, content, { encoding: 'utf8' })
