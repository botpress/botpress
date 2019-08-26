import sdk from 'botpress/sdk'
import cluster from 'cluster'
import yn from 'yn'

const msgHandlers: { [messageType: string]: (message: any, worker: cluster.Worker) => void } = {}

/**
 * The master process handles training and rebooting the server.
 * The worker process runs the actual server
 */
export const registerMsgHandler = (messageType: string, handler: (message: any, worker: cluster.Worker) => void) => {
  msgHandlers[messageType] = handler
}

export const setupMasterNode = (logger: sdk.Logger) => {
  registerMsgHandler('reboot_server', (message, worker) => {
    logger.warn(`Restarting server...`)
    worker.disconnect()
    worker.kill()
  })

  cluster.on('exit', () => {
    if (!yn(process.core_env.BP_DISABLE_AUTO_RESTART)) {
      cluster.fork()
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

  cluster.fork()
}
