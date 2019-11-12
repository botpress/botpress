import * as sdk from 'botpress/sdk'
import cluster from 'cluster'
import kmeans from 'ml-kmeans'
import nanoid from 'nanoid'

import { registerMsgHandler } from '../cluster'
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

if (cluster.isWorker) {
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
              completedCb(undefined)
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

if (cluster.isMaster) {
  // cancel svm training once implemented in node binding
  // registerMsgHandler('cancel', async (msg: Message, worder) => {
  // })

  registerMsgHandler('train', async (msg: Message, worker) => {
    const sendToWorker = (msg: Message) => worker.isConnected() && worker.send(msg)

    const svm = new SVMTrainer()
    try {
      const result = await svm.train(msg.payload.points, msg.payload.options, progress =>
        sendToWorker({ type: 'progress', id: msg.id, payload: { progress } })
      )
      sendToWorker({ type: 'done', id: msg.id, payload: { result } })
    } catch (error) {
      sendToWorker({ type: 'error', id: msg.id, payload: { error } })
    }
  })
}

export default MLToolkit
