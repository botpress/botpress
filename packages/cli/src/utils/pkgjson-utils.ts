import fs from 'fs'
import pathlib from 'path'

export type PackageJson = {
  name: string
  version?: string
  description?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

const FILE_NAME = 'package.json'

export const readPackageJson = async (path: string): Promise<PackageJson | undefined> => {
  const filePath = pathlib.basename(path) === FILE_NAME ? path : pathlib.join(path, FILE_NAME)
  if (!fs.existsSync(filePath)) {
    return undefined
  }

  const strContent: string = await fs.promises.readFile(filePath, 'utf8')
  const jsonContent = JSON.parse(strContent)
  return jsonContent
}

export const findDependency = (pkgJson: PackageJson, name: string): string | undefined => {
  const { dependencies, devDependencies, peerDependencies } = pkgJson
  const allDependencies = { ...(dependencies ?? {}), ...(devDependencies ?? {}), ...(peerDependencies ?? {}) }
  return allDependencies[name]
}
