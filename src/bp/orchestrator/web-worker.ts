import cluster from 'cluster'
import { container } from 'core/app/inversify/app.inversify'
import { HTTPServer } from 'core/app/server'
import { TYPES } from 'core/types'
import { MessageType, onProcessExit, WorkerType, ProcType } from './master'

const debug = DEBUG('cluster:web')

export const spawnWebWorker = () => {
  const { id } = cluster.fork({
    SERVER_ID: process.SERVER_ID,
    INTERNAL_PASSWORD: process.INTERNAL_PASSWORD,
    WORKER_TYPE: WorkerType.WEB
  })

  process.WEB_WORKER = id
  debug('Spawned Web Worker')
}

export const setupWebWorker = () => {
  // Server ID and internal password are provided by the master node
  process.SERVER_ID = process.env.SERVER_ID!
  process.INTERNAL_PASSWORD = process.env.INTERNAL_PASSWORD!

  process.on('message', async (message: { type: any; processType: ProcType; port: number }) => {
    const { type, processType, port } = message
    if (type !== MessageType.BroadcastProcess) {
      return
    }

    switch (processType) {
      case 'web':
        // Once the web worker is registered, we have all we need to start the studio
        process.send!({ type: MessageType.StartStudio })
        break
      case 'studio':
        process.STUDIO_PORT = port

        const httpServer = container.get<HTTPServer>(TYPES.HTTPServer)
        await httpServer.setupStudioProxy()
        break
      case 'nlu':
        process.NLU_PORT = port
        break
    }
  })
}

export const onWebWorkerExit = (code, signal, logger) => {
  onProcessExit({
    processType: 'web',
    code,
    signal,
    logger,
    restartMethod: async () => {
      await spawnWebWorker()
    }
  })
}
