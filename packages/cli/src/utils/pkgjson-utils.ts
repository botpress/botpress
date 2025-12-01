import fs from 'fs'
import pathlib from 'path'
import * as json from './json-utils'

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
  const parseResult = json.safeParseJson(strContent)
  if (!parseResult.success) {
    throw new Error(`Failed to parse JSON at ${filePath}: ${parseResult.error.message}`)
  }

  return parseResult.data as PackageJson
}

export type ReadPackageJsonResult =
  | {
      success: true
      pkgJson?: PackageJson
    }
  | {
      success: false
      error: Error
    }

export const safeReadPackageJson = async (path: string): Promise<ReadPackageJsonResult> => {
  try {
    const pkgJson = await readPackageJson(path)
    if (!pkgJson) {
      return { success: true }
    }
    return { success: true, pkgJson }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    return { success: false, error }
  }
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
