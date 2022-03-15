import axios, { AxiosInstance } from 'axios'
import sdk from 'botpress/sdk'
import { ChildProcess, fork, spawn } from 'child_process'
import { forceForwardSlashes } from 'core/misc/utils'
import fse from 'fs-extra'
import _ from 'lodash'
import path from 'path'
import portFinder from 'portfinder'
import { onProcessExit, registerProcess, processes, registerMsgHandler, MessageType } from './master'

export interface WebWorkerParams {
  EXTERNAL_URL: string
  APP_SECRET: string
  ROOT_PATH: string
}

let initialParams: WebWorkerParams

const debug = DEBUG('orchestrator:studio')

let studioHandle: ChildProcess
let studioClient: AxiosInstance | undefined

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
  },
  checkBotMigrations: async (botId?: string) => {
    try {
      await studioClient?.post('/checkBotMigrations', { botId })
    } catch {}
  },
  getDebugScopes: async (): Promise<object> => {
    try {
      if (studioClient) {
        const { data } = await studioClient.get('/getDebugScopes')
        return data || {}
      }
    } catch {}

    return {}
  },
  setDebugScopes: async (scopes: string) => {
    try {
      await studioClient?.post('/setDebugScopes', { scopes })
    } catch {}
  },
  invalidateCmsForBot: async (botId: string) => {
    await studioClient?.post('/invalidateCmsForBot', { botId })
  }
}

export const initStudioClient = () => {
  studioClient = axios.create({
    proxy: false,
    headers: { authorization: process.INTERNAL_PASSWORD },
    baseURL: `http://localhost:${process.STUDIO_PORT}/api/internal`
  })
}

export const registerStudioMainHandler = (logger: sdk.Logger) => {
  registerMsgHandler(MessageType.StartStudio, async message => {
    await startStudio(logger, message.params as WebWorkerParams)
  })
}

export const startStudio = async (logger: sdk.Logger, params: WebWorkerParams) => {
  const studioPort = await portFinder.getPortPromise({ port: 3000 + 1000 })
  registerProcess('studio', studioPort)

  // Since the studio is in a subfolder, we must adjust module paths
  const fixModulesPath = () => {
    if (!process.env.BP_MODULES_PATH) {
      return path.join(process.PROJECT_LOCATION, '../../modules')
    }

    return process.env.BP_MODULES_PATH.split(':')
      .map(p => forceForwardSlashes(path.resolve(p)))
      .join('::')
  }

  const env = {
    // The node path is set by PKG, but other env variables are required (eg: for colors)
    ..._.omit(process.env, ['NODE_PATH']),
    // Fix for pkg failing to start in some cases (eg: ecs)
    NODE_OPTIONS: '',
    // The data folder is shared between the studio and the runtime
    PROJECT_LOCATION: process.PROJECT_LOCATION,
    APP_DATA_PATH: process.APP_DATA_PATH,
    PRO_ENABLED: process.IS_PRO_ENABLED?.toString(),
    STUDIO_PORT: processes.studio.port.toString(),
    CORE_PORT: processes.web.port.toString(),
    INTERNAL_PASSWORD: process.INTERNAL_PASSWORD,
    BP_DATA_FOLDER: path.join(process.PROJECT_LOCATION, 'data'),
    BP_MODULES_PATH: fixModulesPath(),
    // These params are processed by the web worker
    EXTERNAL_URL: params.EXTERNAL_URL,
    APP_SECRET: params.APP_SECRET,
    ROOT_PATH: params.ROOT_PATH,
    SERVER_ID: process.SERVER_ID,
    BOTPRESS_VERSION: process.BOTPRESS_VERSION,
    CORE_DISABLE_FILE_LISTENERS: process.core_env.CORE_DISABLE_FILE_LISTENERS?.toString()
  }

  // We store the dynamic params so we can reuse them when auto-restarting the studio process
  initialParams = params

  if (process.pkg || !process.core_env.DEV_STUDIO_PATH) {
    const basePath = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../')
    const file = path.resolve(basePath, `bin/studio${process.distro.os === 'win32' ? '.exe' : ''}`)

    if (!(await fse.pathExists(file))) {
      logger.warn('Studio executable not found.')
      return
    }

    studioHandle = spawn(file, [], { env, stdio: 'inherit' })
  } else if (process.core_env.DEV_STUDIO_PATH) {
    const file = path.resolve(process.core_env.DEV_STUDIO_PATH, 'index.js')
    studioHandle = fork(file, undefined, { execArgv: [], env, cwd: path.dirname(file) })
  }

  studioHandle.on('exit', async (code: number, signal: string) => {
    debug('Studio exiting %o', { code, signal })

    onProcessExit({
      processType: 'studio',
      code,
      signal,
      logger,
      restartMethod: async () => {
        await startStudio(logger, initialParams)
      }
    })
  })
}

export const killStudioProcess = () => {
  studioHandle?.kill('SIGKILL')
}
