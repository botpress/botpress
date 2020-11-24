import * as sdk from 'botpress/sdk'
import mkdirp from 'mkdirp'
import path from 'path'

import en from '../translations/en.json'

import api from './api'
import { copyFileLocally, createDefaultPackageJson, executeNpm, syncAllFiles } from './utils'

export let sharedLibsDir
export let packageJsonPath
export let packageLockJsonPath

let broascastSync
const onServerStarted = async (bp: typeof sdk) => {
  sharedLibsDir = path.join(process.cwd(), 'shared_libs')
  packageJsonPath = path.join(sharedLibsDir, 'package.json')
  packageLockJsonPath = path.join(sharedLibsDir, 'package-lock.json')

  await syncAllFiles(bp)

  const initialSetup = await executeNpm()
  bp.logger.info(`Updating shared libraries... ${initialSetup}`)

  const synchronize = async (triggerInstall?: boolean, files?: string[]) => {
    if (files !== undefined) {
      await syncAllFiles(bp)
    } else {
      await Promise.mapSeries(files, file => copyFileLocally(file, bp))
    }

    if (triggerInstall) {
      bp.logger.info(await executeNpm())
    }
  }

  broascastSync = await bp.distributed.broadcast(synchronize)
}

const onServerReady = async (bp: typeof sdk) => {
  mkdirp.sync(sharedLibsDir)

  await createDefaultPackageJson()

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
  translations: { en },
  definition: {
    name: 'libraries',
    menuIcon: 'book',
    menuText: 'Libraries',
    noInterface: false,
    fullName: 'Libraries',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
