import fs from 'fs'
import pathlib from 'path'
import { Logger } from '../logger'
import { tryParseJSON } from './temp-parse-utils'

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

export const readPackageJson = async (path: string, debugNote: string = ''): Promise<PackageJson | undefined> => {
  const logger = new Logger()
  logger.log(`Reading package.json | ${debugNote}`)
  const filePath = _resolveFilePath(path)
  if (!fs.existsSync(filePath)) {
    return undefined
  }

  const strContent: string = await fs.promises.readFile(filePath, 'utf8')
  try {
    const jsonContent = tryParseJSON(strContent, 'readPackageJson')
    return jsonContent
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.error(
      `Failed to read package.json -> "${error.message}"\n\n${JSON.stringify({ filePath, strContent }, null, 2)}`
    )
    throw error
  }
}

export const findDependency = (pkgJson: PackageJson, name: string): string | undefined => {
  const { dependencies, devDependencies, peerDependencies } = pkgJson
  const allDependencies = { ...(dependencies ?? {}), ...(devDependencies ?? {}), ...(peerDependencies ?? {}) }
  return allDependencies[name]
}

export const writePackageJson = async (path: string, pkgJson: PackageJson) => {
  const logger = new Logger()
  logger.log('Writing to package.json')
  const filePath = _resolveFilePath(path)
  await fs.promises.writeFile(filePath, JSON.stringify(pkgJson, null, 2))
}

function _resolveFilePath(path: string) {
  return pathlib.basename(path) === FILE_NAME ? path : pathlib.join(path, FILE_NAME)
}
