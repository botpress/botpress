import * as sdk from 'botpress/sdk'
import { spawn } from 'child_process'
import fse from 'fs-extra'
import path from 'path'
import tmp from 'tmp'

import { packageJsonPath, packageLockJsonPath, sharedLibsDir } from '.'

export const executeNpm = async (args: string[] = ['install'], customLibsDir?: string): Promise<string> => {
  const moduleDir = process.LOADED_MODULES['libraries']
  const nodeFolder = process.pkg ? 'node_production_modules' : 'node_modules'

  const spawned = spawn(process.execPath, [`${moduleDir}/${nodeFolder}/npm/bin/npm-cli.js`, ...args], {
    cwd: customLibsDir ? customLibsDir : sharedLibsDir,
    env: {
      ...process.env,
      PKG_EXECPATH: 'PKG_INVOKE_NODEJS'
    }
  })

  const resultBuffer: string[] = []

  spawned.stdout.on('data', msg => resultBuffer.push(msg.toString()))
  spawned.stderr.on('data', msg => resultBuffer.push(msg.toString()))

  await Promise.fromCallback(cb => spawned.stdout.on('end', cb))

  return resultBuffer.join('')
}

export const packageLibrary = async (name: string, version: string) => {
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })

  try {
    const jsonPackage = {
      name,
      version: '1.0.0',
      description: '',
      license: 'MIT',
      dependencies: {
        [name]: version
      },
      bundledDependencies: [name]
    }

    await fse.writeFile(path.join(tmpDir.name, 'package.json'), JSON.stringify(jsonPackage, undefined, 2))
    await executeNpm(['install'], tmpDir.name)
    await executeNpm(['pack'], tmpDir.name)

    const archiveName = (await fse.readdir(tmpDir.name)).find(x => x.endsWith('.tgz'))
    return await fse.readFile(path.join(tmpDir.name, archiveName))
  } finally {
    tmpDir.removeCallback()
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

export const removeLibrary = async (name: string) => {
  const packageContent = JSON.parse(await fse.readFile(packageJsonPath, 'UTF-8'))
  delete packageContent.dependencies[name]

  await fse.writeFile(packageJsonPath, JSON.stringify(packageContent, undefined, 2))
}

export const publishPackageChanges = async (bp: typeof sdk) => {
  const packageContent = await fse.readFile(packageJsonPath, 'UTF-8')
  await bp.ghost.forGlobal().upsertFile('/libraries', 'package.json', packageContent)

  const packageLockContent = await fse.readFile(packageLockJsonPath, 'UTF-8')
  await bp.ghost.forGlobal().upsertFile('/libraries', 'package-lock.json', packageLockContent)
}

export const createDefaultPackageJson = async () => {
  if (await fse.pathExists(packageJsonPath)) {
    return
  }

  const baseJson = {
    name: 'shared_libs',
    version: '1.0.0',
    description: 'Shared Libraries',
    dependencies: {},
    author: '',
    license: 'MIT'
  }

  await fse.writeFile(packageJsonPath, JSON.stringify(baseJson, undefined, 2))
}
