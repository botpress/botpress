import { NLU } from 'botpress/sdk'
import cluster, { Worker } from 'cluster'
import _ from 'lodash'
import { deserializeError, serializeError } from 'ml/error-utils'
import { TrainingAlreadyStarted, TrainingCanceled } from 'nlu-core/errors'

import { registerMsgHandler, spawnNewTrainingWorker, WORKER_TYPES } from '../../cluster'
import { initializeTools } from '../initialize-tools'
import { Trainer, TrainInput, TrainOutput } from '../training-pipeline'
import { Tools } from '../typings'

import {
  AllIncomingMessages,
  AllOutgoingMessages,
  IncomingMessage,
  isLog,
  isStartTraining,
  isTrainingCanceled,
  isTrainingDone,
  isTrainingError,
  isTrainingProgress,
  isWorkerReady,
  OutgoingMessage
} from './communication'

export class TrainingWorkerQueue {
  private readyWorkers: number[] = []
  private activeWorkers: { [trainSessionId: string]: number } = {}

  constructor(private config: NLU.LanguageConfig, private logger: NLU.Logger) {}

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
    const msg: OutgoingMessage<'cancel_training'> = { type: 'cancel_training', payload: {}, destWorkerId }
    return new Promise(resolve => {
      const handler = (msg: AllIncomingMessages) => {
        if (isTrainingCanceled(msg) && msg.srcWorkerId === destWorkerId) {
          process.off('message', handler)
          resolve()
        }
      }
      process.send!(msg)
      process.on('message', handler)
    })
  }

  public async startTraining(
    trainSessionId: string,
    input: TrainInput,
    progress: (x: number) => void
  ): Promise<TrainOutput> {
    if (!!this.activeWorkers[trainSessionId]) {
      throw new TrainingAlreadyStarted(`Training ${trainSessionId} already started`)
    }

    if (!this.readyWorkers.length) {
      const newWorker = await this._createNewWorker(trainSessionId)
      this.readyWorkers.push(newWorker)
    }

    const worker = this.readyWorkers.pop()!
    this.activeWorkers[trainSessionId] = worker

    let output: TrainOutput
    try {
      output = await this._startTraining(worker, input, progress)
    } catch (err) {
      const isTrainingCanceled = err instanceof TrainingCanceled
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
    destWorkerId: number,
    input: TrainInput,
    progress: (x: number) => void
  ): Promise<TrainOutput> {
    const msg: OutgoingMessage<'start_training'> = {
      type: 'start_training',
      destWorkerId,
      payload: { input }
    }

    return new Promise((resolve, reject) => {
      const handler = (msg: AllIncomingMessages) => {
        if (msg.srcWorkerId !== destWorkerId) {
          return
        }

        if (isTrainingDone(msg)) {
          process.off('message', handler)
          resolve(msg.payload.output)
        }
        if (isTrainingError(msg)) {
          process.off('message', handler)
          reject(deserializeError(msg.payload.error))
        }
        if (isTrainingCanceled(msg)) {
          process.off('message', handler)
          reject(new TrainingCanceled())
        }
        if (isTrainingProgress(msg)) {
          progress(msg.payload.progress)
        }
      }
      process.send!(msg)
      process.on('message', handler)
    })
  }

  private _createNewWorker(requestId: string): Promise<number> {
    const { config } = this
    const msg: OutgoingMessage<'make_new_worker'> = {
      type: 'make_new_worker',
      payload: { config, requestId },
      destWorkerId: NaN
    }

    return new Promise(resolve => {
      const handler = (msg: AllIncomingMessages) => {
        if (isLog(msg) && msg.payload.requestId === requestId) {
          this._logMessage(msg)
        }

        if (isWorkerReady(msg) && msg.payload.requestId === requestId) {
          process.off('message', handler)
          resolve(msg.srcWorkerId)
        }
      }
      process.send!(msg)
      process.on('message', handler)
    })
  }

  private _logMessage(msg: IncomingMessage<'log'>) {
    const { log } = msg.payload
    log.info && this.logger.info(log.info)
    log.warning && this.logger.warning(log.warning)
    log.error && this.logger.error(log.error)
  }
}

if (cluster.isMaster) {
  function sendToWebWorker(msg: AllIncomingMessages) {
    const webWorker = cluster.workers[process.WEB_WORKER]
    webWorker?.isConnected() && webWorker.send(msg)
  }

  function sendToTrainingWorker(msg: AllOutgoingMessages) {
    const worker = cluster.workers[msg.destWorkerId]
    worker?.send(msg) // TODO: find out why this is sometimes undefined.
  }

  function killTrainingWorker(msg: OutgoingMessage<'cancel_training'>) {
    const worker = cluster.workers[msg.destWorkerId]

    if (!worker) {
      const response: IncomingMessage<'training_canceled'> = {
        type: 'training_canceled',
        payload: {},
        srcWorkerId: msg.destWorkerId
      }
      return sendToWebWorker(response)
    }

    const exitHandler = (worker: Worker, _exitCode: number, _signal: string) => {
      const response: IncomingMessage<'training_canceled'> = {
        type: 'training_canceled',
        payload: {},
        srcWorkerId: worker.id
      }
      sendToWebWorker(response)
    }
    cluster.once('exit', exitHandler)

    worker.process.kill('SIGKILL')
  }

  registerMsgHandler('make_new_worker', async (msg: OutgoingMessage<'make_new_worker'>) =>
    spawnNewTrainingWorker(msg.payload.config, msg.payload.requestId)
  )
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
  const requestId = process.env.REQUEST_ID!

  const srcWorkerId = cluster.worker.id
  const logger: NLU.Logger = {
    info: (msg: string) => {
      const response: IncomingMessage<'log'> = { type: 'log', payload: { log: { info: msg }, requestId }, srcWorkerId }
      process.send!(response)
    },
    warning: (msg: string, err?: Error) => {
      const warning = `${msg} ${serializeError(err)}`
      const response: IncomingMessage<'log'> = { type: 'log', payload: { log: { warning }, requestId }, srcWorkerId }
      process.send!(response)
    },
    error: (msg: string, err?: Error) => {
      const error = `${msg} ${serializeError(err)}`
      const response: IncomingMessage<'log'> = { type: 'log', payload: { log: { error }, requestId }, srcWorkerId }
      process.send!(response)
    }
  }

  const msgHandler = (tools: Tools) => async (msg: AllOutgoingMessages) => {
    if (isStartTraining(msg)) {
      const { input } = msg.payload

      const progressCb = (progress: number) => {
        const res: IncomingMessage<'training_progress'> = {
          type: 'training_progress',
          payload: { progress },
          srcWorkerId
        }
        process.send!(res)
      }

      tools.seededLodashProvider.setSeed(input.nluSeed)

      let output: TrainOutput | undefined
      try {
        output = await Trainer(input, tools, progressCb)
      } catch (err) {
        const res: IncomingMessage<'training_error'> = {
          type: 'training_error',
          payload: { error: serializeError(err) },
          srcWorkerId
        }
        process.send!(res)
      } finally {
        tools.seededLodashProvider.resetSeed()
      }

      const res: IncomingMessage<'training_done'> = { type: 'training_done', payload: { output }, srcWorkerId }
      process.send!(res)
    }
  }

  // tslint:disable-next-line: no-floating-promises
  initializeTools(config, logger)
    .then(tools => {
      process.on('message', msgHandler(tools))
      const res: IncomingMessage<'worker_ready'> = { type: 'worker_ready', payload: { requestId }, srcWorkerId }
      process.send!(res)
    })
    .catch(err => {
      logger.error('The following error occured during initialization of tools', err)
    })
}
