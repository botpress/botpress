import fs from 'fs'
import pathlib from 'path'

type JSON = string | number | boolean | null | JSON[] | { [key: string]: JSON }

export type PackageJson = {
  name: string
  version?: string
  description?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
} & {
  [key: string]: JSON
}

const FILE_NAME = 'package.json'

export const readPackageJson = async (path: string): Promise<PackageJson | undefined> => {
  const filePath = _resolveFilePath(path)
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

export const writePackageJson = async (path: string, pkgJson: PackageJson) => {
  const filePath = _resolveFilePath(path)
  await fs.promises.writeFile(filePath, JSON.stringify(pkgJson, null, 2))
}

function _resolveFilePath(path: string) {
  return pathlib.basename(path) === FILE_NAME ? path : pathlib.join(path, FILE_NAME)
}
