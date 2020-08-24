import { NLU } from 'botpress/sdk'
import cluster, { Worker } from 'cluster'

import { registerMsgHandler, spawnNewTrainingWorker, WORKER_TYPES } from '../cluster'

import { initializeTools } from './initialize-tools'
import { Trainer, TrainInput, TrainOutput } from './training-pipeline'

type OutgoingPayload = Partial<{
  config: NLU.Config
  input: TrainInput
}>
type OutgoingMessageType = 'make_new_worker' | 'start_training' | 'cancel_training'
interface OutgoingMessage {
  type: OutgoingMessageType
  payload: OutgoingPayload
  destWid?: number
}

type Log = Partial<{ info: string; warning: string; error: string }>
type IncomingPayload = Partial<{
  log: Log
  workerId: number
  output: TrainOutput
  error: string
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
  srcWid: number
}

export class TrainingWorkerQueue {
  private waitingWorkers: number[] = []
  private activeWorkers: { [trainSessionId: string]: number } = {}

  constructor(private config: NLU.Config, private logger: NLU.Logger) {}

  public async cancelTraining(trainSessionId: string): Promise<void> {
    const workerId = this.activeWorkers[trainSessionId]
    if (!workerId) {
      return
    }

    await this._cancelTraining(workerId)

    delete this.activeWorkers[trainSessionId]
  }

  private _cancelTraining(destWid: number) {
    const msg: OutgoingMessage = { type: 'cancel_training', payload: {}, destWid }
    return new Promise(resolve => {
      const handler = (msg: IncomingMessage) => {
        if (msg.type === 'training_canceled') {
          console.log(`training of worker #${msg.srcWid} canceled with sucess`)
          process.off('message', handler)
          resolve()
        }
      }
      process.send!(msg)
      process.on('message', handler)
    })
  }

  public async startTraining(trainSessionId: string, input: TrainInput, progress?: (x: number) => void) {
    if (!!this.activeWorkers[trainSessionId]) {
      return // training already started
    }

    if (!this.waitingWorkers.length) {
      const newWorker = await this._createNewWorker()
      this.waitingWorkers.push(newWorker)
    }

    const worker = this.waitingWorkers.pop()!
    this.activeWorkers[trainSessionId] = worker

    let output: TrainOutput
    try {
      output = await this._startTraining(worker, input, progress)
    } catch (err) {
      throw err // so error is thrown without a warning about rejected promise
    } finally {
      const worker = this.activeWorkers[trainSessionId]
      this.waitingWorkers.unshift(worker)
      delete this.activeWorkers[trainSessionId]
    }
    return output
  }

  private async _startTraining(
    workerId: number,
    input: TrainInput,
    progress?: (x: number) => void
  ): Promise<TrainOutput> {
    const msg: OutgoingMessage = { type: 'start_training', destWid: workerId, payload: { input } }

    return new Promise((resolve, reject) => {
      const handler = (msg: IncomingMessage) => {
        if (msg.type === 'training_done') {
          process.off('message', handler)
          resolve(msg.payload.output!)
        }
        if (msg.type === 'training_error') {
          process.off('message', handler)
          reject(msg.payload.error!)
        }
        if (progress && msg.type === 'training_progress') {
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
          resolve(msg.srcWid)
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
    const worker = cluster.workers[msg.destWid!]
    worker?.send(msg) // TODO: find out why this is sometimes undefined.
  }

  function killTrainingWorker(msg: OutgoingMessage) {
    const worker = cluster.workers[msg.destWid!]

    if (!worker) {
      const response: IncomingMessage = { type: 'training_canceled', payload: {}, srcWid: msg.destWid! }
      return sendToWebWorker(response)
    }

    worker!.kill('SIGKILL')
    const exitHandler = (worker: Worker, _exitCode: number, _signal: string) => {
      const response: IncomingMessage = { type: 'training_canceled', payload: {}, srcWid: worker.id }
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

  const srcWid = cluster.worker.id
  const logger: NLU.Logger = {
    info: (info: string) => {
      const msg: IncomingMessage = { type: 'log', payload: { log: { info } }, srcWid }
      process.send!(msg)
    },
    warning: (warning: string) => {
      const msg: IncomingMessage = { type: 'log', payload: { log: { warning } }, srcWid }
      process.send!(msg)
    },
    error: (error: string) => {
      const msg: IncomingMessage = { type: 'log', payload: { log: { error } }, srcWid }
      process.send!(msg)
    }
  }

  async function main() {
    const tools = await initializeTools(config, logger)
    process.on('message', async (msg: OutgoingMessage) => {
      if (msg.type === 'start_training') {
        const { input } = msg.payload

        const progressCb = (progress: number) => {
          const res: IncomingMessage = { type: 'training_progress', payload: { progress }, srcWid: srcWid }
          process.send!(res)
        }

        let output: TrainOutput | undefined
        try {
          output = await Trainer(input!, tools, progressCb)
        } catch (err) {
          const res: IncomingMessage = { type: 'training_error', payload: { error: err.message }, srcWid: srcWid }
          process.send!(res)
        }

        const res: IncomingMessage = { type: 'training_done', payload: { output }, srcWid: srcWid }
        process.send!(res)
      }
    })

    const res: IncomingMessage = { type: 'worker_ready', payload: {}, srcWid: srcWid }
    process.send!(res)
  }

  // tslint:disable-next-line: no-floating-promises
  main()
}
