import sdk from 'botpress/sdk'
import cluster from 'cluster'
import _ from 'lodash'
import ms from 'ms'
import nanoid from 'nanoid/generate'
import os from 'os'
import yn from 'yn'

export enum WORKER_TYPES {
  WEB = 'WEB_WORKER',
  LOCAL_ACTION_SERVER = 'LOCAL_ACTION_SERVER'
}

const MESSAGE_TYPE_START_LOCAL_ACTION_SERVER = 'start_local_action_server'

export interface StartLocalActionServerMessage {
  appSecret: string
  port: number
}

const debug = DEBUG('cluster')

const msgHandlers: { [messageType: string]: (message: any, worker: cluster.Worker) => void } = {}

const maxServerReebots = process.core_env.BP_MAX_SERVER_REBOOT || 2
let webServerRebootCount = 0

/**
 * The master process handles training and rebooting the server.
 * The worker process runs the actual server
 *
 * Exit code 0 or undefined: Success (kill worker & master)
 * Exit code 1: Error (will try to respawn workers)
 */
export const registerMsgHandler = (messageType: string, handler: (message: any, worker: cluster.Worker) => void) => {
  msgHandlers[messageType] = handler
}

export const setupMasterNode = (logger: sdk.Logger) => {
  process.SERVER_ID = process.env.SERVER_ID || nanoid('1234567890abcdefghijklmnopqrstuvwxyz', 10)

  // Fix an issue with pkg when passing custom options for v8
  cluster.setupMaster({ execArgv: process.pkg ? [] : process.execArgv })

  registerMsgHandler('reboot_server', (_message, worker) => {
    logger.warn(`Restarting server...`)
    worker.disconnect()
    worker.kill()
  })

  registerMsgHandler(MESSAGE_TYPE_START_LOCAL_ACTION_SERVER, (message: StartLocalActionServerMessage) => {
    const { appSecret, port } = message
    cluster.fork({ WORKER_TYPE: WORKER_TYPES.LOCAL_ACTION_SERVER, APP_SECRET: appSecret, PORT: port })
  })

  cluster.on('exit', async (worker, code, signal) => {
    const { exitedAfterDisconnect, id } = worker
    debug(`Process exiting %o`, { workerId: id, code, signal, exitedAfterDisconnect })
    // Reset the counter when the reboot was intended
    if (exitedAfterDisconnect) {
      webServerRebootCount = 0
      // Clean exit
    } else if (code === 0) {
      process.exit(0)
    }

    if (!yn(process.core_env.BP_DISABLE_AUTO_RESTART)) {
      if (webServerRebootCount >= maxServerReebots) {
        logger.error(
          `Exceeded the maximum number of automatic server reboot (${maxServerReebots}). Set the "BP_MAX_SERVER_REBOOT" environment variable to change that`
        )
        process.exit(0)
      }
      spawnWebWorker()
      webServerRebootCount++
    }
  })

  cluster.on('message', (worker: cluster.Worker, message: any) => {
    const handler = msgHandlers[message.type]
    if (!handler) {
      return logger.error(`No handler configured for ${message.type}`)
    }

    try {
      handler(message, worker)
    } catch (err) {
      logger.attachError(err).error(`Error while processing worker message ${message.type}`)
    }
  })

  spawnWebWorker()
}

function spawnWebWorker() {
  const { id } = cluster.fork({ SERVER_ID: process.SERVER_ID, WORKER_TYPE: WORKER_TYPES.WEB })
  process.WEB_WORKER = id
  debug(`Spawned Web Worker`)
}

let spawnMLWorkersCount = 0
setTimeout(() => {
  spawnMLWorkersCount = 0
}, ms('2m'))

export const startLocalActionServer = (message: StartLocalActionServerMessage) => {
  process.send!({ type: MESSAGE_TYPE_START_LOCAL_ACTION_SERVER, ...message })
}
