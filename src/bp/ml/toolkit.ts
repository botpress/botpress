import * as sdk from 'botpress/sdk'
import cluster, { Worker } from 'cluster'
import _ from 'lodash'
import kmeans from 'ml-kmeans'
import nanoid from 'nanoid'

import { registerMsgHandler, spawnMLWorkers, WORKER_TYPES } from '../cluster'
const { Tagger, Trainer: CRFTrainer } = require('./crfsuite')
import { FastTextModel } from './fasttext'
import computeJaroWinklerDistance from './homebrew/jaro-winkler'
import computeLevenshteinDistance from './homebrew/levenshtein'
import { processor } from './sentencepiece'
import { Predictor, Trainer as SVMTrainer } from './svm'

// those messgages are global preprend with svm_ if we ever come up with more message types
type MsgTypeSVM = 'train' | 'progress' | 'done' | 'error'

interface Message {
  type: MsgTypeSVM
  id: string
  payload: any
}

const MLToolkit: typeof sdk.MLToolkit = {
  KMeans: {
    kmeans
  },
  CRF: {
    createTagger: Tagger,
    createTrainer: CRFTrainer
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
    return Promise.fromCallback(completedCb => {
      const id = nanoid()
      const messageHandler = (msg: Message) => {
        if (progressCb && msg.type === 'progress' && msg.id === id) {
          try {
            progressCb(msg.payload.progress)
          } catch (err) {
            if (err.name === 'CancelError') {
              process.off('message', messageHandler)
              // process.send!({ type: 'cancel', id })
              completedCb(err)
            }
          }
        }

        if (msg.type === 'done' && msg.id === id) {
          process.off('message', messageHandler)
          completedCb(undefined, msg.payload.result)
        }

        if (msg.type === 'error' && msg.id === id) {
          process.off('message', messageHandler)
          completedCb(msg.payload.error)
        }
      }

      process.send!({ type: 'train', id, payload: { points, options } })
      process.on('message', messageHandler)
    })
  }
}

if (cluster.isWorker) {
  if (process.env.WORKER_TYPE === WORKER_TYPES.WEB) {
    overloadTrainers()
  }
  if (process.env.WORKER_TYPE === WORKER_TYPES.ML) {
    async function messageHandler(msg: Message) {
      if (msg.type === 'train') {
        const svm = new SVMTrainer()
        try {
          let progressCalls = 0
          const result = await svm.train(msg.payload.points, msg.payload.options, progress => {
            if (++progressCalls % 10 === 0 || progress === 1) {
              process.send!({ type: 'progress', id: msg.id, payload: { progress } })
            }
          })

          process.send!({ type: 'done', id: msg.id, payload: { result } })
        } catch (error) {
          process.send!({ type: 'error', id: msg.id, payload: { error } })
        }
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

  registerMsgHandler('done', sendToWebWorker)
  registerMsgHandler('progress', sendToWebWorker)
  registerMsgHandler('error', sendToWebWorker)
  registerMsgHandler('train', async (msg: Message) => (await pickMLWorker()).send(msg))
}

export default MLToolkit
