import * as sdk from 'botpress/sdk'
import fse from 'fs-extra'
import mkdirp from 'mkdirp'
import path from 'path'

import en from '../translations/en.json'
import fr from '../translations/fr.json'

import api from './api'
import {
  copyFileLocally,
  createDefaultExample,
  createDefaultPackageJson,
  createNodeSymlink,
  executeNpm,
  syncAllFiles
} from './utils'

export let sharedLibsDir
export let packageJsonPath
export let packageLockJsonPath
export let isOffline
export let bpLogger: sdk.Logger

let broascastSync

const onServerStarted = async (bp: typeof sdk) => {
  sharedLibsDir = path.join(process.cwd(), 'shared_libs')
  packageJsonPath = path.join(sharedLibsDir, 'package.json')
  packageLockJsonPath = path.join(sharedLibsDir, 'package-lock.json')
  bpLogger = bp.logger

  const config = await bp.config.getModuleConfig('libraries')
  if (config.offlineMode) {
    isOffline = true
  }

  mkdirp.sync(sharedLibsDir)

  await syncAllFiles(bp)

  if (!(await fse.pathExists(packageJsonPath))) {
    await createDefaultPackageJson()
    await createDefaultExample(bp)
  }

  await createNodeSymlink()

  const initialSetup = await executeNpm()
  bp.logger.info(`Updating shared libraries...\n${initialSetup}`)

  const synchronize = async (triggerInstall?: boolean, file?: string) => {
    if (file !== undefined) {
      await copyFileLocally(file, bp)
    } else {
      await syncAllFiles(bp)
    }

    if (triggerInstall) {
      bp.logger.info(await executeNpm())
    }
  }

  broascastSync = await bp.distributed.broadcast(synchronize)
}

const onServerReady = async (bp: typeof sdk) => {
  const copyLocally = async (fullPath: string) => {
    if (!fullPath.startsWith('data/global/libraries/')) {
      return
    }

    const filePath = fullPath.replace('data/global/libraries/', '')

    await copyFileLocally(filePath, bp)

    broascastSync(filePath === 'package.json', filePath)
  }

  bp.ghost.forRoot().onFileChanged(copyLocally)
  bp.ghost.forGlobal().onFileChanged(copyLocally)

  await api(bp)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.http.deleteRouterForBot('libraries')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onModuleUnmount,
  translations: { en, fr },
  definition: {
    name: 'libraries',
    menuIcon: 'book',
    menuText: 'Libraries',
    // Do we still keep it as a web app for global (shared libs.. ?)
    noInterface: true,
    workspaceApp: { bots: false, global: true },
    experimental: true,
    fullName: 'Libraries',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
