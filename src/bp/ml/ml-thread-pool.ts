import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import os from 'os'

import { MLThreadScheduler } from './ml-thread-scheduler'

type MsgType =
  | 'svm_train'
  | 'svm_progress'
  | 'svm_done'
  | 'svm_error'
  | 'crf_train'
  | 'crf_progress'
  | 'crf_done'
  | 'crf_error'

type Payload = Partial<{
  progress: number
  result: string
  error: string
  points: (sdk.MLToolkit.SVM.DataPoint | sdk.MLToolkit.CRF.DataPoint)[]
  options: sdk.MLToolkit.SVM.SVMOptions | sdk.MLToolkit.CRF.TrainerOptions
}>

export interface Message {
  type: MsgType
  id: string
  payload: Payload
}

const MAX_CRF_WORKERS = 1

export class MLThreadPool {
  private svmWorkerScheduler: MLThreadScheduler
  private crfWorkerScheduler: MLThreadScheduler

  constructor() {
    const maxSvmWorkers = Math.max(os.cpus().length - 1, 1) // ncpus - webworker
    const numSvmWorkers = Math.min(maxSvmWorkers, process.core_env.BP_NUM_ML_THREADS || 4)
    this.svmWorkerScheduler = new MLThreadScheduler(numSvmWorkers)
    this.crfWorkerScheduler = new MLThreadScheduler(MAX_CRF_WORKERS)
  }

  public async startSvmTraining(
    trainingId: string,
    points: sdk.MLToolkit.SVM.DataPoint[],
    options: Partial<sdk.MLToolkit.SVM.SVMOptions>,
    progress: sdk.MLToolkit.SVM.TrainProgressCallback | undefined,
    complete: (model: string) => void,
    error: (error: Error) => void
  ) {
    const worker = await this.svmWorkerScheduler.getNext()

    const messageHandler = (msg: Message) => {
      if (msg.id !== trainingId) {
        return
      }
      if (progress && msg.type === 'svm_progress') {
        try {
          progress(msg.payload.progress!)
        } catch (err) {
          error(err)
          worker.off('message', messageHandler)
        }
      }

      if (msg.type === 'svm_done') {
        complete(msg.payload.result!)
        worker.off('message', messageHandler)
      }

      if (msg.type === 'svm_error') {
        error(new Error(msg.payload.error!))
        worker.off('message', messageHandler)
      }
    }
    worker.postMessage({ type: 'svm_train', id: trainingId, payload: { points, options } })
    worker.on('message', messageHandler)
  }

  /**
   * Currently dupplicated with svm...
   * I'll think of some way of either merge the code into one general function or let them evolve differently.
   * Not sure yet, but not my current focus anyway.
   */
  public async startCrfTraining(
    trainingId: string,
    points: sdk.MLToolkit.CRF.DataPoint[],
    options: sdk.MLToolkit.CRF.TrainerOptions,
    progress: ((iteration: number) => void) | undefined,
    complete: (modelFilePath: string) => void,
    error: (error: Error) => void
  ) {
    const worker = await this.crfWorkerScheduler.getNext()

    const messageHandler = (msg: Message) => {
      if (msg.id !== trainingId) {
        return
      }
      if (progress && msg.type === 'crf_progress') {
        try {
          progress(msg.payload.progress!)
        } catch (err) {
          error(err)
          worker.off('message', messageHandler)
        }
      }

      if (msg.type === 'crf_done') {
        complete(msg.payload.result!)
        worker.off('message', messageHandler)
      }

      if (msg.type === 'crf_error') {
        error(new Error(msg.payload.error!))
        worker.off('message', messageHandler)
      }
    }
    worker.postMessage({ type: 'crf_train', id: trainingId, payload: { points, options } })
    worker.on('message', messageHandler)
  }
}
