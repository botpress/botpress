import cluster from 'cluster'
import { container } from 'core/app/inversify/app.inversify'
import { HTTPServer } from 'core/app/server'
import { TYPES } from 'core/types'
import { MessageType, onProcessExit, WorkerType, ProcType } from './master'
import { killMessagingProcess } from './messaging-server'
import { killNluProcess } from './nlu-server'
import { initStudioClient, killStudioProcess } from './studio-client'

const debug = DEBUG('orchestrator:web')

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
        process.send!({
          type: MessageType.StartStudio,
          params: {
            EXTERNAL_URL: process.EXTERNAL_URL,
            ROOT_PATH: process.ROOT_PATH,
            APP_SECRET: process.APP_SECRET
          }
        })
        break
      case 'studio':
        process.STUDIO_PORT = port

        const httpServer = container.get<HTTPServer>(TYPES.HTTPServer)
        await httpServer.setupStudioProxy()

        initStudioClient()
        break
      case 'messaging':
        process.MESSAGING_PORT = port
        break
      case 'nlu':
        process.NLU_PORT = port
        break
    }
  })
}

export const onWebWorkerExit = (code, signal, logger, exitedAfterDisconnect) => {
  killNluProcess()
  killStudioProcess()
  killMessagingProcess()

  onProcessExit({
    processType: 'web',
    code,
    signal,
    logger,
    exitedAfterDisconnect,
    restartMethod: () => {
      spawnWebWorker()
    }
  })
}
