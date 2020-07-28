import * as sdk from 'botpress/sdk'
import cluster, { Worker } from 'cluster'
import _ from 'lodash'
import kmeans from 'ml-kmeans'
import nanoid from 'nanoid'

import { registerMsgHandler, spawnMLWorkers, WORKER_TYPES } from '../cluster'
import { Tagger, Trainer as CRFTrainer } from './crf'
import { FastTextModel } from './fasttext'
import computeJaroWinklerDistance from './homebrew/jaro-winkler'
import computeLevenshteinDistance from './homebrew/levenshtein'
import { processor } from './sentencepiece'
import { Predictor, Trainer as SVMTrainer } from './svm'
import { SVMTrainingPool } from './svm-pool'
import { CRFTrainingPool } from './crf-pool'

type MsgType =
  | 'svm_train'
  | 'svm_progress'
  | 'svm_done'
  | 'svm_error'
  | 'svm_kill'
  | 'crf_train'
  | 'crf_progress'
  | 'crf_done'
  | 'crf_error'
  | 'crf_kill'

interface Message {
  type: MsgType
  id: string
  payload: any
  workerPid: number
}

// assuming 10 bots, 10 ctx * (oos, intent) + ndu + ctx cls + slot tagger
// all training concurrently
const MAX_TRAINING_LISTENENRS = 10 * (10 * 2 + 2)

const MLToolkit: typeof sdk.MLToolkit = {
  KMeans: {
    kmeans
  },
  CRF: {
    Tagger: Tagger,
    Trainer: CRFTrainer
  },
  SVM: {
    Predictor,
    Trainer: SVMTrainer
  },
  FastText: { Model: FastTextModel },
  Strings: { computeLevenshteinDistance, computeJaroWinklerDistance },
  SentencePiece: { createProcessor: processor }
}

function overloadTrainers() {
  MLToolkit.SVM.Trainer.prototype.train = (
    points: sdk.MLToolkit.SVM.DataPoint[],
    options?: Partial<sdk.MLToolkit.SVM.SVMOptions>,
    progressCb?: sdk.MLToolkit.SVM.TrainProgressCallback | undefined
  ): any => {
    process.setMaxListeners(MAX_TRAINING_LISTENENRS)

    return Promise.fromCallback(completedCb => {
      const id = nanoid()
      const messageHandler = (msg: Message) => {
        if (msg.id !== id) {
          return
        }
        if (progressCb && msg.type === 'svm_progress') {
          try {
            progressCb(msg.payload.progress)
          } catch (err) {
            completedCb(err)

            const { workerPid } = msg
            process.send!({ type: 'svm_kill', id: msg.id, payload: {}, workerPid })

            process.off('message', messageHandler)
          }
        }

        if (msg.type === 'svm_done') {
          completedCb(undefined, msg.payload.result)
          process.off('message', messageHandler)
        }

        if (msg.type === 'svm_error') {
          completedCb(msg.payload.error)
          process.off('message', messageHandler)
        }
      }

      process.send!({ type: 'svm_train', id, payload: { points, options } })
      process.on('message', messageHandler)
    })
  }

  MLToolkit.CRF.Trainer.prototype.train = (
    elements: sdk.MLToolkit.CRF.DataPoint[],
    params: sdk.MLToolkit.CRF.TrainerOptions,
    progressCb?: (iteration: number) => void
  ): Promise<string> => {
    return Promise.fromCallback(completedCb => {
      const id = nanoid()
      const messageHandler = (msg: Message) => {
        if (msg.id !== id) {
          return
        }

        if (progressCb && msg.type === 'crf_progress') {
          try {
            progressCb(msg.payload.progress)
          } catch (err) {
            completedCb(err)

            const { workerPid } = msg
            process.send!({ type: 'crf_kill', id: msg.id, payload: {}, workerPid })

            process.off('message', messageHandler)
          }
        }

        if (msg.type === 'crf_done') {
          completedCb(undefined, msg.payload.crfModelFilename)
          process.off('message', messageHandler)
        }

        if (msg.type === 'crf_error') {
          completedCb(msg.payload.error)
          process.off('message', messageHandler)
        }
      }

      process.send!({ type: 'crf_train', id, payload: { elements, params } })
      process.on('message', messageHandler)
    }) as any
  }
}

if (cluster.isWorker) {
  if (process.env.WORKER_TYPE === WORKER_TYPES.WEB) {
    overloadTrainers()
  }
  if (process.env.WORKER_TYPE === WORKER_TYPES.ML) {
    const svmPool = new SVMTrainingPool() // one svm pool per ml worker
    const crfPool = new CRFTrainingPool()
    async function messageHandler(msg: Message) {
      if (msg.type === 'svm_train') {
        let svmProgressCalls = 0

        // tslint:disable-next-line: no-floating-promises
        await svmPool.startTraining(
          msg.id,
          msg.payload.points,
          msg.payload.options,
          progress => {
            if (++svmProgressCalls % 10 === 0 || progress === 1) {
              process.send!({ type: 'svm_progress', id: msg.id, payload: { progress }, workerPid: process.pid })
            }
          },
          result => process.send!({ type: 'svm_done', id: msg.id, payload: { result } }),
          error => process.send!({ type: 'svm_error', id: msg.id, payload: { error } })
        )
      }

      if (msg.type === 'svm_kill') {
        svmPool.cancelTraining(msg.id)
      }

      if (msg.type === 'crf_train') {
        const { elements, params } = msg.payload
        // tslint:disable-next-line: no-floating-promises
        crfPool.startTraining(
          msg.id,
          elements,
          params,
          iteration => {
            process.send!({ type: 'crf_progress', id: msg.id, payload: { iteration }, workerPid: process.pid })
            return 0
          },
          model => process.send!({ type: 'crf_done', id: msg.id, payload: { crfModelFilename: model } }),
          error => process.send!({ type: 'crf_error', id: msg.id, payload: { error } })
        )
      }

      if (msg.type === 'crf_kill') {
        crfPool.cancelTraining(msg.id)
      }
    }

    process.on('message', messageHandler)
  }
}

if (cluster.isMaster) {
  function sendToWebWorker(msg: Message) {
    const webWorker = cluster.workers[process.WEB_WORKER]
    webWorker?.isConnected() && webWorker.send(msg)
  }

  let spawnPromise: Promise<void> | undefined
  async function pickMLWorker(): Promise<Worker> {
    if (_.isEmpty(process.ML_WORKERS) && !spawnPromise) {
      spawnPromise = spawnMLWorkers()
    }
    if (spawnPromise) {
      await spawnPromise
      spawnPromise = undefined
    }

    const idx = Math.floor(Math.random() * process.ML_WORKERS.length)
    const workerID = process.ML_WORKERS[idx]
    const worker = cluster.workers[workerID!]
    if (worker?.isDead() || !worker?.isConnected()) {
      process.ML_WORKERS.splice(idx, 1)
      return pickMLWorker()
    }

    return worker
  }

  function getMLWorker(pid?: number): Worker | undefined {
    if (!pid) {
      return
    }
    return Object.values(cluster.workers).find(w => w && w.process.pid === pid)
  }

  registerMsgHandler('svm_done', sendToWebWorker)
  registerMsgHandler('svm_progress', sendToWebWorker)
  registerMsgHandler('svm_error', sendToWebWorker)
  registerMsgHandler('svm_train', async (msg: Message) => (await pickMLWorker()).send(msg))
  registerMsgHandler('svm_kill', async (msg: Message) => getMLWorker(msg.workerPid)?.send(msg))

  registerMsgHandler('crf_done', sendToWebWorker)
  registerMsgHandler('crf_progress', sendToWebWorker)
  registerMsgHandler('crf_error', sendToWebWorker)
  registerMsgHandler('crf_train', async (msg: Message) => (await pickMLWorker()).send(msg))
  registerMsgHandler('crf_kill', async (msg: Message) => getMLWorker(msg.workerPid)?.send(msg))
}

export default MLToolkit
