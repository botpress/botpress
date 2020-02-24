import sdk from 'botpress/sdk'
import cluster from 'cluster'
import { BotpressConfig } from 'core/config/botpress.config'
import _ from 'lodash'
import ms from 'ms'
import nanoid from 'nanoid/generate'
import os from 'os'
import yn from 'yn'

export type WorkerType = 'ML_WORKER' | 'WEB_WORKER'

const debug = DEBUG('cluster')

const msgHandlers: { [messageType: string]: (message: any, worker: cluster.Worker) => void } = {}

const maxReboots = process.core_env.BP_MAX_SERVER_REBOOT || 2
let rebootCount = 0

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

export const setupMasterNode = (logger: sdk.Logger, config: BotpressConfig) => {
  process.SERVER_ID = process.env.SERVER_ID || nanoid('1234567890abcdefghijklmnopqrstuvwxyz', 10)

  registerMsgHandler('reboot_server', (_message, worker) => {
    logger.warn(`Restarting server...`)
    worker.disconnect()
    worker.kill()
  })

  cluster.on('exit', async (worker, code, signal) => {
    const workerIdx = process.ML_WORKERS.indexOf(worker.id)
    if (workerIdx !== -1) {
      debug(`Machine learning worker ${worker.id} died`)
      process.ML_WORKERS.splice(workerIdx, 1)
      if (process.ML_WORKERS.length === 0) {
        await spawnMLWorkers(logger)
      }
      return
    }

    const { exitedAfterDisconnect, id } = worker
    debug(`Process exiting %o`, { workerId: id, code, signal, exitedAfterDisconnect })
    // Reset the counter when the reboot was intended
    if (exitedAfterDisconnect) {
      rebootCount = 0
      // Clean exit
    } else if (code === 0) {
      process.exit(0)
    }

    if (!yn(process.core_env.BP_DISABLE_AUTO_RESTART)) {
      if (rebootCount >= maxReboots) {
        logger.error(
          `Exceeded the maximum number of automatic server reboot (${maxReboots}). Set the "BP_MAX_SERVER_REBOOT" environment variable to change that`
        )
        process.exit(0)
      }
      spawnWebWorker()
      rebootCount++
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
  const { id } = cluster.fork({ SERVER_ID: process.SERVER_ID, WORKER_TYPE: <WorkerType>'WEB_WORKER' })
  process.WEB_WORKER = id
}

let spawnMLWorkersCount = 0
setTimeout(() => {
  spawnMLWorkersCount = 0
}, ms('2m'))

export async function spawnMLWorkers(logger?: sdk.Logger) {
  if (spawnMLWorkersCount > 2) {
    logger?.error(`Exceeded the number of automatic ml worker reboot`)
    process.exit(0)
  }
  const maxMLWorkers = Math.max(os.cpus().length - 1, 1) // ncpus - webworker
  const numMLWorkers = Math.min(maxMLWorkers, process.core_env.BP_NUM_ML_WORKERS || 4)

  process.ML_WORKERS = await Promise.map(_.range(numMLWorkers), () => {
    const worker = cluster.fork({ WORKER_TYPE: <WorkerType>'ML_WORKER' })
    return Promise.fromCallback(cb => worker.on('online', () => cb(undefined, worker.id)))
  })
  spawnMLWorkersCount++
  debug(`Spawned ${numMLWorkers} machine learning workers`)
}
