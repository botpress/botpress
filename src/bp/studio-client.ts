import axios, { AxiosInstance } from 'axios'
import sdk from 'botpress/sdk'
import { ChildProcess, fork, spawn } from 'child_process'
import fse from 'fs-extra'
import _ from 'lodash'
import path from 'path'
import yn from 'yn'

const debug = DEBUG('studio')

const maxServerReebots = process.core_env.BP_MAX_SERVER_REBOOT || 2
let studioRebootCount = 0
let studioHandle: ChildProcess
let studioClient: AxiosInstance

export const studioActions = {
  updateTokenVersion: async (email: string, strategy: string, tokenVersion: number) => {
    try {
      await studioClient?.post('/updateTokenVersion', { email, strategy, tokenVersion })
    } catch {}
  },
  invalidateFile: async (key: string) => {
    try {
      await studioClient?.post('/invalidateFile', { key })
    } catch {}
  },
  setBotMountStatus: async (botId: string, isMounted: boolean) => {
    try {
      await studioClient?.post('/setBotMountStatus', { botId, isMounted })
    } catch {}
  }
}

export const startStudio = async (logger: sdk.Logger) => {
  const env = {
    ...process.env,
    // The data folder is shared between the studio and the runtime
    PROJECT_LOCATION: process.PROJECT_LOCATION,
    APP_DATA_PATH: process.APP_DATA_PATH,
    EXTERNAL_URL: process.EXTERNAL_URL,
    APP_SECRET: process.APP_SECRET,
    PRO_ENABLED: process.IS_PRO_ENABLED?.toString(),
    STUDIO_PORT: process.STUDIO_PORT.toString(),
    CORE_PORT: process.PORT.toString(),
    ROOT_PATH: process.ROOT_PATH,
    INTERNAL_PASSWORD: process.INTERNAL_PASSWORD,
    BP_DATA_FOLDER: path.join(process.PROJECT_LOCATION, 'data'),
    // TODO: not the final fix
    BP_MODULES_PATH: path.join(process.PROJECT_LOCATION, '../../modules')
  }

  if (process.pkg || !process.core_env.DEV_STUDIO_PATH) {
    const basePath = process.pkg ? path.dirname(process.execPath) : __dirname
    const file = path.resolve(basePath, `./studio${process.distro.os === 'win32' ? '.exe' : ''}`)

    if (!(await fse.pathExists(file))) {
      console.error('Studio executable not found.')
      return
    }

    studioHandle = spawn(file, [], { env, stdio: 'inherit' })
  } else if (process.core_env.DEV_STUDIO_PATH) {
    const file = path.resolve(process.core_env.DEV_STUDIO_PATH, 'index.js')
    const cwd = path.resolve(process.core_env.DEV_STUDIO_PATH)

    studioHandle = fork(file, undefined, { execArgv: undefined, env, cwd })
  }

  studioClient = axios.create({
    headers: { authorization: process.INTERNAL_PASSWORD },
    baseURL: `http://localhost:${process.STUDIO_PORT}/api/internal`
  })

  studioHandle.on('exit', async (code: number, signal: string) => {
    debug('Studio exiting %o', { code, signal })

    if (!yn(process.core_env.BP_DISABLE_AUTO_RESTART)) {
      if (studioRebootCount >= maxServerReebots) {
        logger.error(
          `Exceeded the maximum number of automatic server reboot (${maxServerReebots}). Set the "BP_MAX_SERVER_REBOOT" environment variable to change that`
        )
        process.exit(0)
      }

      await startStudio(logger)
      studioRebootCount++
    }
  })
}
