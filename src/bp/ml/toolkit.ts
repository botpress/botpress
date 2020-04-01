import * as sdk from 'botpress/sdk'
import cluster, { Worker } from 'cluster'
import _ from 'lodash'
import kmeans from 'ml-kmeans'
import nanoid from 'nanoid'
import tmp from 'tmp'

import { registerMsgHandler, spawnMLWorkers, WORKER_TYPES } from '../cluster'
const { Tagger, Trainer: CRFTrainer } = require('./crfsuite')
import { FastTextModel } from './fasttext'
import computeJaroWinklerDistance from './homebrew/jaro-winkler'
import computeLevenshteinDistance from './homebrew/levenshtein'
import { processor } from './sentencepiece'
import { Predictor, Trainer as SVMTrainer } from './svm'

type MsgType = 'svm_train' | 'svm_progress' | 'svm_done' | 'svm_error' | 'crf_train' | 'crf_done' | 'crf_error'

interface Message {
  type: MsgType
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
        if (msg.id !== id) {
          return
        }
        if (progressCb && msg.type === 'svm_progress') {
          try {
            progressCb(msg.payload.progress)
          } catch (err) {
            completedCb(err)
            process.off('message', messageHandler)
            // TODO once svm binding supports cancelation,if error is Cancel Error send cancel message
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

  MLToolkit.CRF.createTrainer.prototype.train = (elements: any, params?: any): any => {
    return Promise.fromCallback(completedCb => {
      const id = nanoid()
      const messageHandler = (msg: Message) => {
        if (msg.id !== id) {
          return
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
    })
  }
}

if (cluster.isWorker) {
  if (process.env.WORKER_TYPE === WORKER_TYPES.WEB) {
    overloadTrainers()
  }
  if (process.env.WORKER_TYPE === WORKER_TYPES.ML) {
    async function messageHandler(msg: Message) {
      if (msg.type === 'svm_train') {
        const svm = new SVMTrainer()
        try {
          let progressCalls = 0
          const result = await svm.train(msg.payload.points, msg.payload.options, progress => {
            if (++progressCalls % 10 === 0 || progress === 1) {
              process.send!({ type: 'svm_progress', id: msg.id, payload: { progress } })
            }
          })

          process.send!({ type: 'svm_done', id: msg.id, payload: { result } })
        } catch (error) {
          process.send!({ type: 'svm_error', id: msg.id, payload: { error } })
        }
      }

      if (msg.type === 'crf_train') {
        const debugTrain = DEBUG('nlu').sub('training')
        const trainer = new CRFTrainer()

        try {
          trainer.set_params(msg.payload.params)
          trainer.set_callback(str => debugTrain('CRFSUITE', str))

          for (const { features, labels } of msg.payload.elements) {
            trainer.append(features, labels)
          }

          const crfModelFilename = tmp.fileSync({ postfix: '.bin' }).name
          trainer.train(crfModelFilename)

          process.send!({ type: 'crf_done', id: msg.id, payload: { crfModelFilename } })
        } catch (error) {
          process.send!({ type: 'crf_error', id: msg.id, payload: { error } })
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

  registerMsgHandler('svm_done', sendToWebWorker)
  registerMsgHandler('svm_progress', sendToWebWorker)
  registerMsgHandler('svm_error', sendToWebWorker)
  registerMsgHandler('svm_train', async (msg: Message) => (await pickMLWorker()).send(msg))

  registerMsgHandler('crf_train', async (msg: Message) => (await pickMLWorker()).send(msg))
  registerMsgHandler('crf_done', sendToWebWorker)
  registerMsgHandler('crf_error', sendToWebWorker)
}

export default MLToolkit
