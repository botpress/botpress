import sdk from 'botpress/sdk'
import cluster from 'cluster'
import nanoid from 'nanoid/generate'
import yn from 'yn'

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

export const setupMasterNode = (logger: sdk.Logger) => {
  process.SERVER_ID = process.env.SERVER_ID || nanoid('1234567890abcdefghijklmnopqrstuvwxyz', 10)

  registerMsgHandler('reboot_server', (_message, worker) => {
    logger.warn(`Restarting server...`)
    worker.disconnect()
    worker.kill()
  })

  cluster.on('exit', (worker, code, signal) => {
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

      cluster.fork({ SERVER_ID: process.SERVER_ID })
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

  cluster.fork({ SERVER_ID: process.SERVER_ID })
}
