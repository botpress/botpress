import * as sdk from 'botpress/sdk'
import { spawn } from 'child_process'
import fse from 'fs-extra'
import path from 'path'

import { isOffline, packageJsonPath, packageLockJsonPath, sharedLibsDir } from '.'

const debug = DEBUG('libraries')

export const executeNpm = async (args: string[] = ['install'], customLibsDir?: string): Promise<string> => {
  const moduleDir = process.LOADED_MODULES['libraries']
  const nodeFolder = process.pkg ? 'node_production_modules' : 'node_modules'

  try {
    const cwd = customLibsDir ? customLibsDir : sharedLibsDir
    debug('executing npm', { execPath: process.execPath, moduleDir, cwd, args })

    if (isOffline) {
      args.push('--offline')
    }

    // Hides superfluous messages
    args.push('--no-fund')

    // Necessary for post install scripts when running from the binary
    args.push('--scripts-prepend-node-path')

    const spawned = spawn(process.execPath, [`${moduleDir}/${nodeFolder}/npm/bin/npm-cli.js`, ...args], {
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

  if (!(await fse.pathExists(nodePath))) {
    await fse.symlink(process.execPath, nodePath)
  }
}

export const syncAllFiles = async (bp: typeof sdk) => {
  const files = await bp.ghost.forGlobal().directoryListing('libraries/', '*.*')
  await Promise.mapSeries(files, file => copyFileLocally(file, bp))
}

export const copyFileLocally = async (fileName: string, bp: typeof sdk): Promise<boolean> => {
  if (!(await bp.ghost.forGlobal().fileExists('libraries', fileName))) {
    return false
  }

  try {
    const fileContent = await bp.ghost.forGlobal().readFileAsBuffer('libraries', fileName)
    await fse.writeFile(path.join(sharedLibsDir, fileName), fileContent)
    return true
  } catch (err) {
    bp.logger.error(`Couldn't copy locally. ${err}`)
    return false
  }
}

const deleteLibraryArchive = async (filename: string, bp: typeof sdk) => {
  try {
    if (await bp.ghost.forGlobal().fileExists('/libraries', filename)) {
      await bp.ghost.forGlobal().deleteFile('/libraries', filename)
    }

    if (await fse.pathExists(path.join(sharedLibsDir, filename))) {
      await fse.remove(path.join(sharedLibsDir, filename))
    }
  } catch (err) {
    bp.logger.warn(`Error while deleting the library archive ${err}`)
  }
}

export const removeLibrary = async (name: string, bp: typeof sdk) => {
  const packageContent = JSON.parse(await fse.readFile(packageJsonPath, 'UTF-8'))
  const source = packageContent.dependencies[name]

  if (!source) {
    return
  }

  if (source.endsWith('.tgz')) {
    await deleteLibraryArchive(source.replace('file:', ''), bp)
  }

  delete packageContent.dependencies[name]
  await fse.writeFile(packageJsonPath, JSON.stringify(packageContent, undefined, 2))
}

export const publishPackageChanges = async (bp: typeof sdk) => {
  const packageContent = await fse.readFile(packageJsonPath, 'UTF-8')
  await bp.ghost.forGlobal().upsertFile('/libraries', 'package.json', packageContent)

  const packageLockContent = await fse.readFile(packageLockJsonPath, 'UTF-8')
  await bp.ghost.forGlobal().upsertFile('/libraries', 'package-lock.json', packageLockContent)
}

export const createDefaultExample = async (bp: typeof sdk) => {
  const exampleFile = `
  const axios = require('axios')

module.exports = {
  hello: () => console.log('Hello there!'),
  printLog: message => console.log('Custom message:, message),
  getPage: url => axios.get(url)
}`

  await bp.ghost.forGlobal().upsertFile('/libraries', 'example.js', exampleFile)
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

  await fse.writeFile(packageJsonPath, JSON.stringify(baseJson, undefined, 2))
}
