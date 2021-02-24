import * as sdk from 'botpress/sdk'
import { spawn } from 'child_process'
import fse from 'fs-extra'
import path from 'path'

import { isOffline, packageJsonPath, packageLockJsonPath, sharedLibsDir } from '.'
import example from './example'

const debug = DEBUG('libraries')

const LIB_FOLDER = 'libraries/'

const packageNameRegex = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

// Taken from https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const versionRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

const sanitizeArg = (text: string) => text.replace(/[^a-zA-Z0-9\/_.@^\-\(\) ]/g, '').replace(/\/\//, '/')

export const validateNameVersion = ({ name, version }: { name: string; version?: string }) => {
  const nameValid = name && packageNameRegex.test(name)
  const versionValid = !version || (version && versionRegex.test(version.replace('^', ''))) || version.startsWith('git')

  if (!nameValid) {
    throw new Error(`Library name is invalid: ${name}`)
  } else if (!versionValid) {
    throw new Error(`Library version is invalid: ${version}`)
  }

  return { name, version }
}

const prepareArgs = (args: string[]) => {
  if (isOffline) {
    args.push('--offline')
  }

  // Hides superfluous messages
  args.push('--no-fund')

  // Necessary for post install scripts when running from the binary
  args.push('--scripts-prepend-node-path')

  return args.map(x => sanitizeArg(x))
}

export const executeNpm = async (args: string[] = ['install'], customLibsDir?: string): Promise<string> => {
  const moduleDir = process.LOADED_MODULES['libraries']
  const nodeFolder = process.pkg ? 'node_production_modules' : 'node_modules'

  const cleanArgs = prepareArgs(args)

  const cwd = customLibsDir ? customLibsDir : sharedLibsDir
  debug('executing npm', { execPath: process.execPath, moduleDir, cwd, args, cleanArgs })

  try {
    const spawned = spawn(process.execPath, [`${moduleDir}/${nodeFolder}/npm/bin/npm-cli.js`, ...cleanArgs], {
      cwd,
      env: {
        ...process.env,
        PATH: `${process.env.PATH}:${path.dirname(process.execPath)}`,
        PKG_EXECPATH: 'PKG_INVOKE_NODEJS'
      }
    })

    const resultBuffer: string[] = []

    spawned.stdout.on('data', msg => resultBuffer.push(msg.toString()))
    spawned.stderr.on('data', msg => resultBuffer.push(msg.toString()))

    await Promise.fromCallback(cb => spawned.stdout.on('close', cb))

    return resultBuffer.join('')
  } catch (err) {
    console.error('error ', err)
  }
}

export const createNodeSymlink = async () => {
  const nodePath = path.join(path.dirname(process.execPath), 'node')

  // The symlink is only necessary when running the binary and node is not installed
  if (process.execPath.endsWith('bp.exe') || process.execPath.endsWith('bp')) {
    if (!(await fse.pathExists(nodePath))) {
      await fse.symlink(process.execPath, nodePath)
    }
  }
}

export const syncAllFiles = async (bp: typeof sdk) => {
  const files = await bp.ghost.forGlobal().directoryListing(LIB_FOLDER, '*.*')
  await Promise.mapSeries(files, file => copyFileLocally(file, bp))
}

export const copyFileLocally = async (fileName: string, bp: typeof sdk): Promise<boolean> => {
  if (!(await bp.ghost.forGlobal().fileExists(LIB_FOLDER, fileName))) {
    return false
  }

  try {
    const fileContent = await bp.ghost.forGlobal().readFileAsBuffer(LIB_FOLDER, fileName)
    await fse.writeFile(path.join(sharedLibsDir, fileName), fileContent)
    return true
  } catch (err) {
    bp.logger.error(`Couldn't copy locally. ${err}`)
    return false
  }
}

const deleteLibraryArchive = async (filename: string, bp: typeof sdk) => {
  try {
    if (await bp.ghost.forGlobal().fileExists(LIB_FOLDER, filename)) {
      await bp.ghost.forGlobal().deleteFile(LIB_FOLDER, filename)
    }

    if (await fse.pathExists(path.join(sharedLibsDir, filename))) {
      await fse.remove(path.join(sharedLibsDir, filename))
    }
  } catch (err) {
    bp.logger.warn(`Error while deleting the library archive ${err}`)
  }
}

export const removeLibrary = async (name: string, bp: typeof sdk): Promise<boolean> => {
  let source, packageContent
  try {
    packageContent = await fse.readJson(packageJsonPath)
    source = packageContent.dependencies[name]
  } catch (err) {
    bp.logger.attachError(err).error("Couldn't read package json")
    return false
  }

  if (!source) {
    return false
  }

  if (source.endsWith('.tgz')) {
    await deleteLibraryArchive(source.replace('file:', ''), bp)
  }

  delete packageContent.dependencies[name]
  await fse.writeJSON(packageJsonPath, packageContent)

  return true
}

export const publishPackageChanges = async (bp: typeof sdk) => {
  const packageContent = await fse.readFile(packageJsonPath, 'UTF-8')
  await bp.ghost.forGlobal().upsertFile(LIB_FOLDER, 'package.json', packageContent)

  const packageLockContent = await fse.readFile(packageLockJsonPath, 'UTF-8')
  await bp.ghost.forGlobal().upsertFile(LIB_FOLDER, 'package-lock.json', packageLockContent)
}

export const createDefaultExample = async (bp: typeof sdk) => {
  await bp.ghost.forGlobal().upsertFile(LIB_FOLDER, 'example.js', example)
}

export const createDefaultPackageJson = async () => {
  if (await fse.pathExists(packageJsonPath)) {
    return
  }

  const baseJson = {
    name: 'shared_libs',
    version: '1.0.0',
    description: 'Shared Libraries',
    repository: 'none',
    dependencies: {},
    author: '',
    private: true
  }

  await fse.writeJson(packageJsonPath, baseJson)
}
