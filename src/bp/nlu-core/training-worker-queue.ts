import { NLU } from 'botpress/sdk'
import cluster, { Worker } from 'cluster'
import _ from 'lodash'
import { deserializeError, ErrorMessage, serializeError } from 'ml/error-utils'

import { registerMsgHandler, spawnNewTrainingWorker, WORKER_TYPES } from '../cluster'

import { initializeTools } from './initialize-tools'
import { Trainer, TrainInput, TrainOutput } from './training-pipeline'
import { Tools } from './typings'

type OutgoingPayload = Partial<{
  config: NLU.Config
  input: TrainInput
}>
type OutgoingMessageType = 'make_new_worker' | 'start_training' | 'cancel_training'
interface OutgoingMessage {
  type: OutgoingMessageType
  payload: OutgoingPayload
  destWorkerId?: number
}

type Log = Partial<{ info: string; warning: string; error: string }>
type IncomingPayload = Partial<{
  log: Log
  workerId: number
  output: TrainOutput
  error: ErrorMessage
  progress: number
}>
type IncomingMessageType =
  | 'log'
  | 'worker_ready'
  | 'training_canceled'
  | 'training_done'
  | 'training_progress'
  | 'training_error'
interface IncomingMessage {
  type: IncomingMessageType
  payload: IncomingPayload
  srcWorkerId: number
}

export class TrainingCanceledError extends Error {}

export class TrainingWorkerQueue {
  private readyWorkers: number[] = []
  private activeWorkers: { [trainSessionId: string]: number } = {}

  constructor(private config: NLU.Config, private logger: NLU.Logger) {}

  public async cancelTraining(trainSessionId: string): Promise<void> {
    const workerId = this.activeWorkers[trainSessionId]
    if (!workerId) {
      return
    }

    await this._cancelTraining(workerId)

    delete this.activeWorkers[trainSessionId]
    this.readyWorkers = this.readyWorkers.filter(w => w !== workerId) // just in case...
  }

  private _cancelTraining(destWorkerId: number) {
    const msg: OutgoingMessage = { type: 'cancel_training', payload: {}, destWorkerId }
    return new Promise(resolve => {
      const handler = (msg: IncomingMessage) => {
        if (msg.type === 'training_canceled') {
          process.off('message', handler)
          resolve()
        }
      }
      process.send!(msg)
      process.on('message', handler)
    })
  }

  public async startTraining(trainSessionId: string, input: TrainInput, progress: (x: number) => void) {
    if (!!this.activeWorkers[trainSessionId]) {
      return // training already started
    }

    if (!this.readyWorkers.length) {
      const newWorker = await this._createNewWorker()
      this.readyWorkers.push(newWorker)
    }

    const worker = this.readyWorkers.pop()!
    this.activeWorkers[trainSessionId] = worker

    let output: TrainOutput
    try {
      output = await this._startTraining(worker, input, progress)
    } catch (err) {
      const isTrainingCanceled = err instanceof TrainingCanceledError
      if (!isTrainingCanceled) {
        this._prepareForNextTraining(trainSessionId)
      }
      throw err
    }
    this._prepareForNextTraining(trainSessionId)
    return output
  }

  private _prepareForNextTraining(trainSessionId: string) {
    const worker = this.activeWorkers[trainSessionId]
    this.readyWorkers.unshift(worker)
    delete this.activeWorkers[trainSessionId]
  }

  private async _startTraining(
    workerId: number,
    input: TrainInput,
    progress: (x: number) => void
  ): Promise<TrainOutput> {
    const msg: OutgoingMessage = { type: 'start_training', destWorkerId: workerId, payload: { input } }

    return new Promise((resolve, reject) => {
      const handler = (msg: IncomingMessage) => {
        if (msg.type === 'training_done') {
          process.off('message', handler)
          resolve(msg.payload.output!)
        }
        if (msg.type === 'training_error') {
          process.off('message', handler)
          reject(deserializeError(msg.payload.error!))
        }
        if (msg.type === 'training_canceled' && msg.srcWorkerId === workerId) {
          process.off('message', handler)
          reject(new TrainingCanceledError())
        }
        if (msg.type === 'training_progress') {
          progress(msg.payload.progress!)
        }
      }
      process.send!(msg)
      process.on('message', handler)
    })
  }

  private _createNewWorker(): Promise<number> {
    const { config } = this
    const msg: OutgoingMessage = { type: 'make_new_worker', payload: { config } }

    return new Promise(resolve => {
      const handler = (msg: IncomingMessage) => {
        if (msg.type === 'log') {
          this._logMessage(msg)
        }

        if (msg.type === 'worker_ready') {
          process.off('message', handler)
          resolve(msg.srcWorkerId)
        }
      }
      process.send!(msg)
      process.on('message', handler)
    })
  }

  private _logMessage(msg: IncomingMessage) {
    const log: Log = msg.payload.log!
    log.info && this.logger.info(log.info)
    log.warning && this.logger.warning(log.warning)
    log.error && this.logger.error(log.error)
  }
}

if (cluster.isMaster) {
  function sendToWebWorker(msg: IncomingMessage) {
    const webWorker = cluster.workers[process.WEB_WORKER]
    webWorker?.isConnected() && webWorker.send(msg)
  }

  function sendToTrainingWorker(msg: OutgoingMessage) {
    const worker = cluster.workers[msg.destWorkerId!]
    worker?.send(msg) // TODO: find out why this is sometimes undefined.
  }

  function killTrainingWorker(msg: OutgoingMessage) {
    const worker = cluster.workers[msg.destWorkerId!]

    if (!worker) {
      const response: IncomingMessage = { type: 'training_canceled', payload: {}, srcWorkerId: msg.destWorkerId! }
      return sendToWebWorker(response)
    }

    worker!.kill('SIGKILL')
    const exitHandler = (worker: Worker, _exitCode: number, _signal: string) => {
      const response: IncomingMessage = { type: 'training_canceled', payload: {}, srcWorkerId: worker.id }
      sendToWebWorker(response)
    }
    cluster.once('exit', exitHandler)
  }

  registerMsgHandler('make_new_worker', async (msg: OutgoingMessage) => spawnNewTrainingWorker(msg.payload.config!))
  registerMsgHandler('cancel_training', killTrainingWorker)
  registerMsgHandler('start_training', sendToTrainingWorker)

  registerMsgHandler('log', sendToWebWorker)
  registerMsgHandler('worker_ready', sendToWebWorker)
  registerMsgHandler('training_done', sendToWebWorker)
  registerMsgHandler('training_progress', sendToWebWorker)
  registerMsgHandler('training_error', sendToWebWorker)
}

if (cluster.isWorker && process.env.WORKER_TYPE === WORKER_TYPES.TRAINING) {
  const config = JSON.parse(process.env.NLU_CONFIG!)

  const srcWorkerId = cluster.worker.id
  const logger: NLU.Logger = {
    info: (msg: string) => {
      const response: IncomingMessage = { type: 'log', payload: { log: { info: msg } }, srcWorkerId }
      process.send!(response)
    },
    warning: (msg: string, err?: Error) => {
      const warning = `${msg} ${serializeError(err)}`
      const response: IncomingMessage = { type: 'log', payload: { log: { warning } }, srcWorkerId }
      process.send!(response)
    },
    error: (msg: string, err?: Error) => {
      const error = `${msg} ${serializeError(err)}`
      const response: IncomingMessage = { type: 'log', payload: { log: { error } }, srcWorkerId }
      process.send!(response)
    }
  }

  const msgHandler = (tools: Tools) => async (msg: OutgoingMessage) => {
    if (msg.type === 'start_training') {
      const { input } = msg.payload

      const progressCb = (progress: number) => {
        const res: IncomingMessage = { type: 'training_progress', payload: { progress }, srcWorkerId }
        process.send!(res)
      }

      tools.seededLodashProvider.setSeed(input!.nluSeed)

      let output: TrainOutput | undefined
      try {
        output = await Trainer(input!, tools, progressCb)
      } catch (err) {
        const res: IncomingMessage = {
          type: 'training_error',
          payload: { error: serializeError(err) },
          srcWorkerId
        }
        process.send!(res)
      } finally {
        tools.seededLodashProvider.resetSeed()
      }

      const res: IncomingMessage = { type: 'training_done', payload: { output }, srcWorkerId }
      process.send!(res)
    }
  }

  // tslint:disable-next-line: no-floating-promises
  initializeTools(config, logger)
    .then(tools => {
      process.on('message', msgHandler(tools))
      const res: IncomingMessage = { type: 'worker_ready', payload: {}, srcWorkerId }
      process.send!(res)
    })
    .catch(err => {
      logger.error('The following error occured during initialization of tools', err)
    })
}
