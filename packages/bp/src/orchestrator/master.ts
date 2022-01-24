import sdk from 'botpress/sdk'
import cluster, { Worker } from 'cluster'
import _ from 'lodash'
import { customAlphabet, nanoid } from 'nanoid'
import yn from 'yn'

import { setDebugScopes } from '../debug'
import { registerActionServerMainHandler } from './action-server'
import { registerMessagingServerMainHandler } from './messaging-server'
import { registerNluServerMainHandler } from './nlu-server'
import { registerStudioMainHandler } from './studio-client'
import { spawnWebWorker, onWebWorkerExit } from './web-worker'

export enum WorkerType {
  WEB = 'WEB_WORKER',
  LOCAL_ACTION_SERVER = 'LOCAL_ACTION_SERVER',
  LOCAL_STAN_SERVER = 'LOCAL_STAN_SERVER',
  TRAINING = 'TRAINING'
}

export enum MessageType {
  StartStudio = 'START_STUDIO',
  StartActionServer = 'START_ACTION_SERVER',
  StartNluServer = 'START_STAN_SERVER',
  StartMessagingServer = 'START_MESSAGING_SERVER',
  RegisterProcess = 'REGISTER_PROCESS',
  BroadcastProcess = 'BROADCAST_PROCESS',
  RestartServer = 'RESTART_SERVER',
  UpdateDebugScopes = 'UPDATE_DEBUG_SCOPES'
}

export type ProcType = 'web' | 'nlu' | 'action-server' | 'studio' | 'messaging'

interface SubProcesses {
  [type: string]: {
    port: number
    rebootCount: number
    workerId?: number
  }
}

interface ProcessDetails {
  processType: ProcType
  signal?: string | null
  code?: number | null
  workerId?: number
  logger: sdk.Logger
  exitedAfterDisconnect?: boolean
  /** If that subprocess fails after the max number of reboots, kill the main process */
  killOnFail?: boolean
  /** Optional method to restart the process if it is still restartable */
  restartMethod?: Function
}

const debug = DEBUG('orchestrator')
const msgHandlers: { [messageType: string]: (message: any, worker: cluster.Worker) => void } = {}
const maxServerReboots = process.core_env.BP_MAX_SERVER_REBOOT || 2

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

export const processes: SubProcesses = {}

export const registerProcess = (processType: ProcType, port: number, workerId?: number) => {
  const rebootCount = processes[processType] ? processes[processType].rebootCount + 1 : 0
  processes[processType] = { port, workerId, rebootCount }

  debug(`[${processType}] Registering process %o`, processes[processType])

  // We send the new port definitions to connected workers
  for (const work in cluster.workers) {
    cluster.workers[work]?.send({ type: MessageType.BroadcastProcess, processType, port })
  }
}

export const onProcessExit = ({
  processType,
  code,
  signal,
  exitedAfterDisconnect,
  logger,
  killOnFail,
  restartMethod
}: ProcessDetails) => {
  debug(`[${processType}] Process exited %o`, { code, signal, exitedAfterDisconnect })

  if (exitedAfterDisconnect) {
    processes[processType].rebootCount = 0
    // Clean exit
  } else if (code === 0 || signal === 'SIGKILL') {
    if (processType === 'web') {
      process.exit(0)
    } else {
      processes[processType].rebootCount = 0
      return
    }
  }

  if (yn(process.core_env.BP_DISABLE_AUTO_RESTART)) {
    return
  }

  if (processes[processType].rebootCount >= maxServerReboots) {
    logger.error(
      `[${processType}] Exceeded the maximum number of automatic reboot (${maxServerReboots}).\nSet the "BP_MAX_SERVER_REBOOT" environment variable to change that`
    )

    if (killOnFail) {
      process.exit(0)
    } else {
      return
    }
  }

  if (restartMethod) {
    logger.warn(`[${processType}] Restarting process...`)
    restartMethod?.()
  }
}

export const setupMasterNode = (logger: sdk.Logger) => {
  process.SERVER_ID = process.env.SERVER_ID || customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10)()
  process.INTERNAL_PASSWORD = nanoid(75)

  // Fix an issue with pkg when passing custom options for v8
  cluster.setupMaster({ execArgv: process.pkg ? [] : process.execArgv })

  registerActionServerMainHandler()
  registerNluServerMainHandler(logger)
  registerStudioMainHandler(logger)
  registerMessagingServerMainHandler(logger)

  registerMsgHandler(MessageType.RestartServer, (_message, worker) => {
    logger.warn('Restarting server...')
    worker.disconnect()
    worker.kill('SIGKILL')
  })

  // This method allows the web worker to update the master node's debug scope
  registerMsgHandler(MessageType.UpdateDebugScopes, (msg: { scopes: string }) => {
    setDebugScopes(msg.scopes)
  })

  registerMsgHandler(MessageType.RegisterProcess, (msg: { processType: ProcType; port: number }, worker) => {
    registerProcess(msg.processType, msg.port, worker.id)
  })

  cluster.on('exit', async (worker: Worker, code: number, signal: string) => {
    const { exitedAfterDisconnect, id } = worker

    const processType = _.findKey(processes, p => p.workerId === worker.id) as ProcType
    if (processType === 'web') {
      onWebWorkerExit(code, signal, logger, exitedAfterDisconnect)
    }

    // TODO: the debug instance has no access to the debug config. It is in the web process.
    debug('Process exiting %o', { workerId: id, code, signal, exitedAfterDisconnect })
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
