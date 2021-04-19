import cluster from 'cluster'
import { LanguageConfig } from '../../engine/typings'

export enum WORKER_TYPES {
  WEB = 'WEB_WORKER',
  LOCAL_ACTION_SERVER = 'LOCAL_ACTION_SERVER',
  LOCAL_STAN_SERVER = 'LOCAL_STAN_SERVER',
  TRAINING = 'TRAINING'
}

export async function spawnNewTrainingWorker(config: LanguageConfig, requestId: string): Promise<number> {
  if (!process.TRAINING_WORKERS) {
    process.TRAINING_WORKERS = []
  }
  const worker = cluster.fork({
    WORKER_TYPE: WORKER_TYPES.TRAINING,
    NLU_CONFIG: JSON.stringify(config),
    REQUEST_ID: requestId,
    BP_FAILSAFE: false // training workers are allowed to fail and exit
  })
  const workerId = worker.id
  process.TRAINING_WORKERS.push(workerId)
  return new Promise(resolve => worker.on('online', () => resolve(workerId)))
}

const msgHandlers: { [messageType: string]: (message: any, worker: cluster.Worker) => void } = {}

export const registerMsgHandler = (messageType: string, handler: (message: any, worker: cluster.Worker) => void) => {
  msgHandlers[messageType] = handler
}