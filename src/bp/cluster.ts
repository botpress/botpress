import cluster from 'cluster'

const listeners: { [eventType: string]: (message: any, worker: cluster.Worker) => void } = {}

// Registers handlers for messages received by workers (they must be re-created when the worker is restarted)
export const registerListener = (type: string, handler: (message: any, worker: cluster.Worker) => void) => {
  listeners[type] = handler
}

export const setupCluster = () => {
  if (cluster.isMaster) {
    registerListener('reboot', (message, worker) => {
      console.warn(`Restarting server...`)
      try {
        worker.disconnect()
        worker.kill()
      } catch (err) {
        console.error(`Error while restarting server: ${err}`)
      }
    })

    const setupMessaging = (worker: cluster.Worker) => {
      worker.on('message', message => {
        const handler = listeners[message.type]
        if (handler) {
          handler(message, worker)
        } else {
          console.error(`No handler configured for ${message.type}`)
        }
      })
    }

    cluster.on('exit', (deadWorker, code, signal) => {
      setupMessaging(cluster.fork())
    })

    setupMessaging(cluster.fork())
  }
}
