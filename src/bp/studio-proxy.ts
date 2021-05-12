import sdk from 'botpress/sdk'
import { ChildProcess, fork } from 'child_process'
import _ from 'lodash'
import path from 'path'
import yn from 'yn'

export enum StudioMessage {
  INVALIDATE_FILE = 'INVALIDATE_FILE',
  // Ensures the admin and studio have the same authentication policy when users logs off
  UPDATE_TOKEN_VERSION = 'UPDATE_TOKEN_VERSION',
  // Bubbles up events from the studio process to the main process so they can reach module's APIs
  ON_MODULE_EVENT = 'ON_MODULE_EVENT',
  // The studio lacks realtime support, so we process them in the main process
  NOTIFY_FLOW_CHANGE = 'NOTIFY_FLOW_CHANGE',

  SET_BOT_MOUNT_STATUS = 'SET_BOT_MOUNT_STATUS'
}

const debug = DEBUG('studio')

const maxServerReebots = process.core_env.BP_MAX_SERVER_REBOOT || 2
let studioRebootCount = 0
let studioHandle: ChildProcess
const msgHandlers: { [messageType: string]: (message: any) => void } = {}

export const registerStudioHandler = (messageType: string, handler: (message: any) => void) => {
  msgHandlers[messageType] = handler
}

export const studioActions = {
  updateTokenVersion: (email: string, strategy: string, tokenVersion: number) => {
    studioHandle?.send({ type: StudioMessage.UPDATE_TOKEN_VERSION, email, strategy, tokenVersion })
  },
  invalidateFile: (key: string) => {
    studioHandle?.send({ type: StudioMessage.INVALIDATE_FILE, source: 'core', key })
  },
  setBotMountStatus: (botId: string, isMounted: boolean) => {
    studioHandle.send({ type: StudioMessage.SET_BOT_MOUNT_STATUS, botId, isMounted })
  }
}

export const startStudio = async (logger: sdk.Logger) => {
  const fullPath = path.resolve(__dirname, '../../packages/studio/out/index.js')

  studioHandle = fork(fullPath, undefined, {
    env: {
      ...process.env,
      BP_MODULES_PATH: '../../../modules',
      // The data folder is shared between the studio and the runtime
      PROJECT_LOCATION: process.PROJECT_LOCATION,
      APP_DATA_PATH: process.APP_DATA_PATH,
      EXTERNAL_URL: process.EXTERNAL_URL,
      APP_SECRET: process.APP_SECRET,
      PRO_ENABLED: process.IS_PRO_ENABLED?.toString(),
      STUDIO_PORT: process.STUDIO_PORT.toString(),
      RUNTIME_PORT: process.PORT.toString()
    },
    cwd: path.resolve(__dirname, '../../packages/studio/out')
  })

  studioHandle.on('message', message => {
    const handler = msgHandlers[message.type]
    if (!handler) {
      return logger.error(`No handler configured for ${message.type}`)
    }

    try {
      handler(message)
    } catch (err) {
      logger.attachError(err).error(`Error while processing studio message ${message.type}`)
    }
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
